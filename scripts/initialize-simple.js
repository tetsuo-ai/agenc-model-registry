const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, TransactionInstruction } = require("@solana/web3.js");
const fs = require("fs");
const os = require("os");

async function main() {
  // Set up connection
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Load wallet
  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const keypairData = JSON.parse(fs.readFileSync(walletPath));
  const authority = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  // Program ID
  const programId = new PublicKey("3KyiM2oxJueFZmaUbFojSJ83pVkT1bWLiDLeUE8dJwY3");

  // Derive config PDA
  const [configPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );

  console.log("Program ID:", programId.toString());
  console.log("Config PDA:", configPda.toString());
  console.log("Authority:", authority.publicKey.toString());

  // Check if already initialized
  try {
    const configAccount = await connection.getAccountInfo(configPda);
    if (configAccount) {
      console.log("\n✅ Registry already initialized!");
      console.log("Config account exists at:", configPda.toString());
      return;
    }
  } catch (err) {
    // Config doesn't exist, proceed with initialization
  }

  console.log("\nInitializing registry...");

  // Create instruction data (empty for initialize)
  const discriminator = Buffer.from([
    175, 175, 109, 31, 13, 152, 155, 237  // sha256("global:initialize")[0..8]
  ]);

  // Create instruction
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data: discriminator,
  });

  // Create and send transaction
  const tx = new Transaction().add(ix);
  tx.feePayer = authority.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signature = await connection.sendTransaction(tx, [authority]);
  await connection.confirmTransaction(signature, "confirmed");

  console.log("\n✅ Registry initialized successfully!");
  console.log("Transaction signature:", signature);
  console.log("Config PDA:", configPda.toString());
  console.log("\nView on Solana Explorer:");
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
