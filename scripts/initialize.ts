import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

async function main() {
  // Set up provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the program
  const programId = new anchor.web3.PublicKey("3KyiM2oxJueFZmaUbFojSJ83pVkT1bWLiDLeUE8dJwY3");

  // Minimal IDL for initialize
  const idl = {
    version: "0.1.0",
    name: "agenc_model_registry",
    instructions: [
      {
        name: "initialize",
        accounts: [
          { name: "config", isMut: true, isSigner: false },
          { name: "authority", isMut: true, isSigner: true },
          { name: "systemProgram", isMut: false, isSigner: false },
        ],
        args: [],
      },
    ],
    accounts: [],
  };

  const program = new Program(idl as any, provider);

  // Derive config PDA
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );

  console.log("Program ID:", programId.toString());
  console.log("Config PDA:", configPda.toString());
  console.log("Authority:", provider.wallet.publicKey.toString());

  try {
    // Try to fetch config to see if already initialized
    const configAccount = await provider.connection.getAccountInfo(configPda);
    if (configAccount) {
      console.log("\n✅ Registry already initialized!");
      console.log("Config account exists at:", configPda.toString());
      return;
    }
  } catch (err) {
    // Config doesn't exist, proceed with initialization
  }

  console.log("\nInitializing registry...");

  const tx = await (program.methods as any)
    .initialize()
    .accounts({
      config: configPda,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("\n✅ Registry initialized successfully!");
  console.log("Transaction signature:", tx);
  console.log("Config PDA:", configPda.toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
