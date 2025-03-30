import { SpheronSDK } from '@spheron/protocol-sdk';

export class SpheronClient {
  private sdk: SpheronSDK;
  private providerProxyUrl: string;

  constructor(
    network: 'testnet' | 'mainnet' = 'testnet',
    privateKey?: string,
    providerProxyUrl: string = 'http://localhost:3040'
  ) {
    this.sdk = new SpheronSDK(network, privateKey);
    this.providerProxyUrl = providerProxyUrl;
  }

  async createDeployment(iclYaml: string) {
    try {
      const deploymentTxn = await this.sdk.deployment.createDeployment(
        iclYaml,
        this.providerProxyUrl
      );
      return deploymentTxn;
    } catch (error) {
      console.error("Error creating deployment:", error);
      throw error;
    }
  }

  // src/lib/spheron-sdk.ts (continued)
  async getDeployment(deploymentId: string) {
    try {
      const deployment = await this.sdk.deployment.getDeployment(deploymentId);
      return deployment;
    } catch (error) {
      console.error("Error getting deployment:", error);
      throw error;
    }
  }

  async updateDeployment(deploymentId: string, iclYaml: string) {
    try {
      const updateTxn = await this.sdk.deployment.updateDeployment(
        deploymentId,
        iclYaml,
        this.providerProxyUrl
      );
      return updateTxn;
    } catch (error) {
      console.error("Error updating deployment:", error);
      throw error;
    }
  }

  async closeDeployment(deploymentId: string) {
    try {
      const closeTxn = await this.sdk.deployment.closeDeployment(deploymentId);
      return closeTxn;
    } catch (error) {
      console.error("Error closing deployment:", error);
      throw error;
    }
  }

  // Escrow operations
  async getBalance() {
    try {
      const balance = await this.sdk.escrow.getBalance();
      return balance;
    } catch (error) {
      console.error("Error getting balance:", error);
      throw error;
    }
  }

  async deposit(amount: string) {
    try {
      const depositTxn = await this.sdk.escrow.deposit(amount);
      return depositTxn;
    } catch (error) {
      console.error("Error making deposit:", error);
      throw error;
    }
  }

  async withdraw(amount: string) {
    try {
      const withdrawTxn = await this.sdk.escrow.withdraw(amount);
      return withdrawTxn;
    } catch (error) {
      console.error("Error making withdrawal:", error);
      throw error;
    }
  }
}

// Create a singleton instance
let spheronClient: SpheronClient | null = null;

export const getSpheronClient = (
  network: 'testnet' | 'mainnet' = 'testnet',
  privateKey?: string,
  providerProxyUrl?: string
) => {
  if (!spheronClient) {
    spheronClient = new SpheronClient(network, privateKey, providerProxyUrl);
  }
  return spheronClient;
};