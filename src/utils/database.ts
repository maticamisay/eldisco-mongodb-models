import mongoose from 'mongoose';

export interface DatabaseConnectionOptions {
  uri: string;
  options?: mongoose.ConnectOptions;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect({ uri, options = {} }: DatabaseConnectionOptions): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    try {
      const defaultOptions: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
        ...options
      };

      await mongoose.connect(uri, defaultOptions);
      this.isConnected = true;
      console.log('Database connected successfully');

      mongoose.connection.on('error', (error) => {
        console.error('Database connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('Database disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Database disconnection failed:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const dbConnection = DatabaseConnection.getInstance();