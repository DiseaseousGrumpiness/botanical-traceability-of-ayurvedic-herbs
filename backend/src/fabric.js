import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { connect, signers } from '@hyperledger/fabric-gateway';
import { Client, credentials } from '@grpc/grpc-js';

const here = path.dirname(fileURLToPath(import.meta.url));

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function readIdentity() {
  const mspDir = requiredEnv('FABRIC_USER_MSP_DIR');
  const certPath = path.join(mspDir, 'signcerts', 'cert.pem');
  const keyDir = path.join(mspDir, 'keystore');

  if (!fs.existsSync(certPath)) {
    throw new Error(`User certificate not found: ${certPath}`);
  }

  if (!fs.existsSync(keyDir)) {
    throw new Error(`User private-key directory not found: ${keyDir}`);
  }

  const keys = fs.readdirSync(keyDir)
    .filter((name) => !name.startsWith('.'));

  if (keys.length === 0) {
    throw new Error(`No private key found in ${keyDir}`);
  }

  return {
    certificate: fs.readFileSync(certPath),
    privateKey: crypto.createPrivateKey(
      fs.readFileSync(path.join(keyDir, keys[0]))
    ),
  };
}

export function parseResult(bytes) {
  const text = Buffer.from(bytes).toString('utf8');
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function connectFabric() {
  const { certificate, privateKey } = readIdentity();
  const peerTlsCert = fs.readFileSync(requiredEnv('FABRIC_PEER_TLS_CERT'));
  const peerEndpoint = requiredEnv('FABRIC_PEER_ENDPOINT');
  const peerHostAlias = requiredEnv('FABRIC_PEER_HOST_ALIAS');

  const client = new Client(
    peerEndpoint,
    credentials.createSsl(peerTlsCert),
    {
      'grpc.ssl_target_name_override': peerHostAlias,
      'grpc.default_authority': peerHostAlias,
    }
  );

  try {
    const gateway = connect({
      client,
      identity: {
        mspId: requiredEnv('FABRIC_MSP_ID'),
        credentials: certificate,
      },
      signer: signers.newPrivateKeySigner(privateKey),
    });

    const network = gateway.getNetwork(requiredEnv('FABRIC_CHANNEL'));
    const contract = network.getContract(requiredEnv('FABRIC_CHAINCODE'));

    return {
      contract,
      close() {
        gateway.close();
        client.close();
      },
    };
  } catch (error) {
    client.close();
    throw error;
  }
}
