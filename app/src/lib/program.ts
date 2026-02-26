import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../idl.json";

export const PROGRAM_ID = new PublicKey(
  "B6nXK6Cuxbzp8muFFhZSoJqhSAL7BeNiH2bHiwAL5zk7"
);

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, PROGRAM_ID, provider);
}

export function deriveConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
}

export function deriveModelPda(
  publisher: PublicKey,
  modelName: string
): [PublicKey, number] {
  const nameHash = sha256Bytes(modelName);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("model"), publisher.toBuffer(), nameHash],
    PROGRAM_ID
  );
}

export function deriveVersionPda(
  modelPda: PublicKey,
  version: number
): [PublicKey, number] {
  const versionBytes = Buffer.alloc(4);
  versionBytes.writeUInt32LE(version);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("version"), modelPda.toBuffer(), versionBytes],
    PROGRAM_ID
  );
}

// SHA-256 using Web Crypto (sync wrapper using precomputed)
function sha256Bytes(input: string): Buffer {
  // Use a simple JS SHA-256 for PDA derivation (deterministic)
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  // Simple SHA-256 implementation for browser
  return Buffer.from(sha256Simple(data));
}

// Minimal SHA-256 for PDA derivation in browser
function sha256Simple(data: Uint8Array): Uint8Array {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const len = data.length;
  const bitLen = len * 8;
  const padLen = ((len + 8) >> 6) + 1;
  const blocks = new Uint8Array(padLen * 64);
  blocks.set(data);
  blocks[len] = 0x80;
  const dv = new DataView(blocks.buffer);
  dv.setUint32(padLen * 64 - 4, bitLen, false);
  const w = new Uint32Array(64);
  for (let i = 0; i < padLen; i++) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i * 64 + j * 4, false);
    for (let j = 16; j < 64; j++) {
      const s0 = (ror(w[j-15],7)) ^ (ror(w[j-15],18)) ^ (w[j-15] >>> 3);
      const s1 = (ror(w[j-2],17)) ^ (ror(w[j-2],19)) ^ (w[j-2] >>> 10);
      w[j] = (w[j-16] + s0 + w[j-7] + s1) | 0;
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let j = 0; j < 64; j++) {
      const S1 = (ror(e,6)) ^ (ror(e,11)) ^ (ror(e,25));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[j] + w[j]) | 0;
      const S0 = (ror(a,2)) ^ (ror(a,13)) ^ (ror(a,22));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0;
    h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
  }
  const out = new Uint8Array(32);
  new DataView(out.buffer).setUint32(0,h0,false);
  new DataView(out.buffer).setUint32(4,h1,false);
  new DataView(out.buffer).setUint32(8,h2,false);
  new DataView(out.buffer).setUint32(12,h3,false);
  new DataView(out.buffer).setUint32(16,h4,false);
  new DataView(out.buffer).setUint32(20,h5,false);
  new DataView(out.buffer).setUint32(24,h6,false);
  new DataView(out.buffer).setUint32(28,h7,false);
  return out;
}

function ror(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

// Async version using Web Crypto API (for hashing files)
export async function sha256Hash(data: ArrayBuffer): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

export function hashToHex(hash: Uint8Array): string {
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
