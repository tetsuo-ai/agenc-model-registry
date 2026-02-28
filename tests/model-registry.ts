import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AgencModelRegistry } from "../target/types/agenc_model_registry";
import { expect } from "chai";
import * as crypto from "crypto";

describe("agenc-model-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AgencModelRegistry as Program<AgencModelRegistry>;

  // Helper function to derive Model PDA
  function deriveModelPda(modelName: string, publisher: anchor.web3.PublicKey): anchor.web3.PublicKey {
    const nameHash = crypto.createHash('sha256').update(modelName).digest();
    const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("model"),
        publisher.toBuffer(),
        nameHash,
      ],
      program.programId
    );
    return pda;
  }

  // Helper function to derive Version PDA
  function deriveVersionPda(modelPda: anchor.web3.PublicKey, version: number): anchor.web3.PublicKey {
    const versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32LE(version, 0);
    const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("version"),
        modelPda.toBuffer(),
        versionBuffer,
      ],
      program.programId
    );
    return pda;
  }

  // Derive Config PDA
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  // Test data
  const modelName = "test-model";
  const weightsHash = Array.from(crypto.randomBytes(32));
  const metadataUri = "https://arweave.net/test-metadata-uri";
  const license = 0; // MIT

  let modelPda: anchor.web3.PublicKey;
  let firstVersionPda: anchor.web3.PublicKey;
  let secondVersionPda: anchor.web3.PublicKey;

  it("Initialize registry", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          config: configPda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.registryConfig.fetch(configPda);
      expect(config.authority.toString()).to.equal(provider.wallet.publicKey.toString());
      expect(config.totalModels.toNumber()).to.equal(0);
      expect(config.totalVersions.toNumber()).to.equal(0);
    } catch (error) {
      // Config might already exist from previous runs
      console.log("Registry already initialized or error:", error.message);
    }
  });

  it("Publish model", async () => {
    modelPda = deriveModelPda(modelName, provider.wallet.publicKey);
    firstVersionPda = deriveVersionPda(modelPda, 1);

    await program.methods
      .publishModel(
        modelName,
        weightsHash,
        metadataUri,
        license
      )
      .accounts({
        model: modelPda,
        firstVersion: firstVersionPda,
        config: configPda,
        publisher: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify model account
    const model = await program.account.model.fetch(modelPda);
    expect(model.publisher.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(model.modelName).to.equal(modelName);
    expect(Buffer.from(model.weightsHash)).to.deep.equal(Buffer.from(weightsHash));
    expect(model.metadataUri).to.equal(metadataUri);
    expect(model.versionCount).to.equal(1);
    expect(model.isDeprecated).to.equal(false);

    // Verify first version
    const version = await program.account.modelVersion.fetch(firstVersionPda);
    expect(version.model.toString()).to.equal(modelPda.toString());
    expect(version.version).to.equal(1);
    expect(Buffer.from(version.weightsHash)).to.deep.equal(Buffer.from(weightsHash));

    // Verify config counters updated
    const config = await program.account.registryConfig.fetch(configPda);
    expect(config.totalModels.toNumber()).to.be.greaterThan(0);
    expect(config.totalVersions.toNumber()).to.be.greaterThan(0);
  });

  it("Add version", async () => {
    const newWeightsHash = Array.from(crypto.randomBytes(32));
    const newMetadataUri = "https://arweave.net/test-metadata-uri-v2";
    secondVersionPda = deriveVersionPda(modelPda, 2);

    await program.methods
      .addVersion(newWeightsHash, newMetadataUri)
      .accounts({
        model: modelPda,
        newVersion: secondVersionPda,
        config: configPda,
        publisher: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify model updated
    const model = await program.account.model.fetch(modelPda);
    expect(model.versionCount).to.equal(2);
    expect(Buffer.from(model.weightsHash)).to.deep.equal(Buffer.from(newWeightsHash));

    // Verify new version created
    const version = await program.account.modelVersion.fetch(secondVersionPda);
    expect(version.version).to.equal(2);
    expect(Buffer.from(version.weightsHash)).to.deep.equal(Buffer.from(newWeightsHash));
  });

  it("Update metadata", async () => {
    const newMetadataUri = "https://arweave.net/updated-metadata-uri";

    await program.methods
      .updateMetadata(newMetadataUri)
      .accounts({
        model: modelPda,
        publisher: provider.wallet.publicKey,
      })
      .rpc();

    const model = await program.account.model.fetch(modelPda);
    expect(model.metadataUri).to.equal(newMetadataUri);
  });

  it("Deprecate model", async () => {
    await program.methods
      .deprecateModel()
      .accounts({
        model: modelPda,
        publisher: provider.wallet.publicKey,
      })
      .rpc();

    const model = await program.account.model.fetch(modelPda);
    expect(model.isDeprecated).to.equal(true);
  });

  it("Prevent adding version to deprecated model", async () => {
    const newWeightsHash = Array.from(crypto.randomBytes(32));
    const newMetadataUri = "https://arweave.net/test-metadata-uri-v3";
    const thirdVersionPda = deriveVersionPda(modelPda, 3);

    try {
      await program.methods
        .addVersion(newWeightsHash, newMetadataUri)
        .accounts({
          model: modelPda,
          newVersion: thirdVersionPda,
          config: configPda,
          publisher: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Should not reach here
      expect.fail("Expected ModelDeprecated error");
    } catch (error) {
      expect(error.message).to.include("ModelDeprecated");
    }
  });

  it("Transfer ownership", async () => {
    // Create new model for this test
    const newModelName = "transfer-test-model";
    const newModelPda = deriveModelPda(newModelName, provider.wallet.publicKey);
    const newFirstVersionPda = deriveVersionPda(newModelPda, 1);
    const newWeightsHash = Array.from(crypto.randomBytes(32));

    await program.methods
      .publishModel(
        newModelName,
        newWeightsHash,
        metadataUri,
        license
      )
      .accounts({
        model: newModelPda,
        firstVersion: newFirstVersionPda,
        config: configPda,
        publisher: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Create a new keypair for the new owner
    const newOwner = anchor.web3.Keypair.generate();

    await program.methods
      .transferOwnership(newOwner.publicKey)
      .accounts({
        model: newModelPda,
        publisher: provider.wallet.publicKey,
      })
      .rpc();

    const model = await program.account.model.fetch(newModelPda);
    expect(model.publisher.toString()).to.equal(newOwner.publicKey.toString());
  });
});
