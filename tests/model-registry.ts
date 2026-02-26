import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { createHash } from "crypto";

describe("model-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ModelRegistry as Program;
  const publisher = provider.wallet;

  // Derive config PDA
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  // Helper: derive model PDA from name
  function deriveModelPda(modelName: string, pubkey: anchor.web3.PublicKey) {
    const nameHash = createHash("sha256").update(modelName).digest();
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("model"), pubkey.toBuffer(), nameHash],
      program.programId
    );
  }

  // Helper: derive version PDA
  function deriveVersionPda(
    modelPda: anchor.web3.PublicKey,
    versionNum: number
  ) {
    const versionBytes = Buffer.alloc(4);
    versionBytes.writeUInt32LE(versionNum);
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("version"), modelPda.toBuffer(), versionBytes],
      program.programId
    );
  }

  const fakeWeightsHash = createHash("sha256")
    .update("fake-model-weights-v1")
    .digest();
  const metadataUri = "https://arweave.net/test-metadata-tx-id";
  const modelName = "test-gpt2-small";

  it("initializes the registry", async () => {
    await program.methods
      .initialize()
      .accountsStrict({
        config: configPda,
        authority: publisher.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.registryConfig.fetch(configPda);
    expect(config.authority.toBase58()).to.equal(
      publisher.publicKey.toBase58()
    );
    expect(config.totalModels.toNumber()).to.equal(0);
    expect(config.totalVersions.toNumber()).to.equal(0);
  });

  it("publishes a model", async () => {
    const [modelPda] = deriveModelPda(modelName, publisher.publicKey);
    const [versionPda] = deriveVersionPda(modelPda, 1);

    await program.methods
      .publishModel(
        modelName,
        Array.from(fakeWeightsHash),
        metadataUri,
        0 // MIT license
      )
      .accountsStrict({
        config: configPda,
        model: modelPda,
        firstVersion: versionPda,
        publisher: publisher.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const model = await program.account.model.fetch(modelPda);
    expect(model.publisher.toBase58()).to.equal(
      publisher.publicKey.toBase58()
    );
    expect(model.modelName).to.equal(modelName);
    expect(Buffer.from(model.weightsHash)).to.deep.equal(fakeWeightsHash);
    expect(model.metadataUri).to.equal(metadataUri);
    expect(model.versionCount).to.equal(1);
    expect(model.isDeprecated).to.equal(false);

    // Check config was updated
    const config = await program.account.registryConfig.fetch(configPda);
    expect(config.totalModels.toNumber()).to.equal(1);
    expect(config.totalVersions.toNumber()).to.equal(1);

    // Check first version record
    const version = await program.account.modelVersion.fetch(versionPda);
    expect(version.version).to.equal(1);
    expect(Buffer.from(version.weightsHash)).to.deep.equal(fakeWeightsHash);
    expect(version.metadataUri).to.equal(metadataUri);
  });

  it("adds a new version", async () => {
    const [modelPda] = deriveModelPda(modelName, publisher.publicKey);
    const [versionPda] = deriveVersionPda(modelPda, 2);

    const newWeightsHash = createHash("sha256")
      .update("fake-model-weights-v2")
      .digest();
    const newMetadataUri = "https://arweave.net/test-metadata-v2";

    await program.methods
      .addVersion(Array.from(newWeightsHash), newMetadataUri)
      .accountsStrict({
        config: configPda,
        model: modelPda,
        version: versionPda,
        publisher: publisher.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const model = await program.account.model.fetch(modelPda);
    expect(model.versionCount).to.equal(2);
    expect(Buffer.from(model.weightsHash)).to.deep.equal(newWeightsHash);

    const version = await program.account.modelVersion.fetch(versionPda);
    expect(version.version).to.equal(2);
    expect(version.metadataUri).to.equal(newMetadataUri);

    const config = await program.account.registryConfig.fetch(configPda);
    expect(config.totalVersions.toNumber()).to.equal(2);
  });

  it("updates metadata", async () => {
    const [modelPda] = deriveModelPda(modelName, publisher.publicKey);
    const newUri = "https://arweave.net/updated-metadata";

    await program.methods
      .updateMetadata(newUri)
      .accountsStrict({
        model: modelPda,
        publisher: publisher.publicKey,
      })
      .rpc();

    const model = await program.account.model.fetch(modelPda);
    expect(model.metadataUri).to.equal(newUri);
  });

  it("deprecates a model", async () => {
    const [modelPda] = deriveModelPda(modelName, publisher.publicKey);

    await program.methods
      .deprecateModel()
      .accountsStrict({
        model: modelPda,
        publisher: publisher.publicKey,
      })
      .rpc();

    const model = await program.account.model.fetch(modelPda);
    expect(model.isDeprecated).to.equal(true);
  });

  it("prevents adding version to deprecated model", async () => {
    const [modelPda] = deriveModelPda(modelName, publisher.publicKey);
    const [versionPda] = deriveVersionPda(modelPda, 3);

    const weightsHash = createHash("sha256")
      .update("should-fail")
      .digest();

    try {
      await program.methods
        .addVersion(Array.from(weightsHash), "https://arweave.net/fail")
        .accountsStrict({
          config: configPda,
          model: modelPda,
          version: versionPda,
          publisher: publisher.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      // Transaction should fail with ModelDeprecated error
      expect(err.toString()).to.include("ModelDeprecated");
    }
  });

  it("transfers ownership", async () => {
    const [modelPda] = deriveModelPda(modelName, publisher.publicKey);
    const newOwner = anchor.web3.Keypair.generate();

    await program.methods
      .transferOwnership(newOwner.publicKey)
      .accountsStrict({
        model: modelPda,
        publisher: publisher.publicKey,
      })
      .rpc();

    const model = await program.account.model.fetch(modelPda);
    expect(model.publisher.toBase58()).to.equal(
      newOwner.publicKey.toBase58()
    );
  });
});
