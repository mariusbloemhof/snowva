import {
    QueryConstraint,
    Timestamp,
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../firebase.config';

export class FirebaseService<T extends { id: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get collection reference
  protected getCollection() {
    return collection(db, this.collectionName);
  }

  // Get document reference
  protected getDoc(id: string) {
    return doc(db, this.collectionName, id);
  }

  // Convert Firestore timestamp to string
  protected convertTimestamps(data: any): any {
    if (!data) return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.convertTimestamps(item));
    }
    
    const result = { ...data };
    Object.keys(result).forEach(key => {
      if (result[key] instanceof Timestamp) {
        result[key] = result[key].toDate().toISOString();
      } else if (Array.isArray(result[key])) {
        result[key] = result[key].map((item: any) => this.convertTimestamps(item));
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.convertTimestamps(result[key]);
      }
    });
    return result;
  }

  // Convert string dates to Firestore timestamps
  protected prepareForFirestore(data: Partial<T> | Omit<T, 'id'>): any {
    const result: any = { ...data };
    delete result.id; // Remove id from data as it's handled separately
    
    // Add metadata
    if (!result.createdAt) {
      result.createdAt = serverTimestamp();
    }
    result.updatedAt = serverTimestamp();

    // Recursively convert date strings to Timestamp objects
    this.convertDatesToTimestamps(result);

    return result;
  }

  // Recursively convert date strings to Timestamp objects
  private convertDatesToTimestamps(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(item => this.convertDatesToTimestamps(item));
      return;
    }

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string' && this.isDateField(key)) {
        try {
          obj[key] = Timestamp.fromDate(new Date(obj[key]));
        } catch (error) {
          // Keep as string if not a valid date
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.convertDatesToTimestamps(obj[key]);
      }
    });
  }

  // Override this in subclasses to define which fields are dates
  protected isDateField(fieldName: string): boolean {
    return ['date', 'dueDate', 'validUntil', 'createdAt', 'updatedAt', 'effectiveDate', 'issueDate', 'paymentDate'].includes(fieldName);
  }

  // Get all documents
  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(this.getCollection(), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data())
      })) as T[];
    } catch (error) {
      console.error(`Error getting ${this.collectionName}:`, error);
      throw new Error(`Failed to fetch ${this.collectionName}`);
    }
  }

  // Get document by ID
  async getById(id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(this.getDoc(id));
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...this.convertTimestamps(docSnap.data())
        } as T;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ID:`, error);
      throw new Error(`Failed to fetch ${this.collectionName} with ID: ${id}`);
    }
  }

  // Create new document
  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const preparedData = this.prepareForFirestore(data);
      const docRef = await addDoc(this.getCollection(), preparedData);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw new Error(`Failed to create ${this.collectionName}`);
    }
  }

  // Create document with specific ID (for data migration)
  async createWithId(id: string, data: Omit<T, 'id'>): Promise<void> {
    try {
      const preparedData = this.prepareForFirestore(data);
      await setDoc(this.getDoc(id), preparedData);
    } catch (error) {
      console.error(`Error creating ${this.collectionName} with ID ${id}:`, error);
      throw new Error(`Failed to create ${this.collectionName} with ID: ${id}`);
    }
  }

  // Update document
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const preparedData = this.prepareForFirestore(data);
      await updateDoc(this.getDoc(id), preparedData);
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw new Error(`Failed to update ${this.collectionName} with ID: ${id}`);
    }
  }

  // Delete document
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDoc(id));
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw new Error(`Failed to delete ${this.collectionName} with ID: ${id}`);
    }
  }

  // Get documents by field value
  async getByField(fieldName: string, value: any): Promise<T[]> {
    try {
      const q = query(this.getCollection(), where(fieldName, '==', value));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data())
      })) as T[];
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ${fieldName}:`, error);
      throw new Error(`Failed to fetch ${this.collectionName} by ${fieldName}`);
    }
  }

  // Real-time listener
  onSnapshot(
    callback: (data: T[]) => void,
    onError?: (error: Error) => void,
    constraints: QueryConstraint[] = []
  ) {
    const q = query(this.getCollection(), ...constraints);
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...this.convertTimestamps(doc.data())
        })) as T[];
        callback(data);
      },
      (error) => {
        console.error(`Error in ${this.collectionName} listener:`, error);
        onError?.(new Error(`Real-time listener error for ${this.collectionName}`));
      }
    );
  }
}