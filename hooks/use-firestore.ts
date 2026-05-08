'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Client {
  id?: string;
  name: string;
  email: string;
  company: string;
  createdAt: any;
}

export interface Disk {
  path: string;
  status: 'Realizado' | 'Realizando' | 'Pendente';
  pastasRealizadas: number;
  estudos: number;
  send: number;
  totalPastas: number;
  storageMapeado: number;
  storageEnviado: number;
}

export interface Migration {
  id?: string;
  clientId: string;
  clientName: string;
  status: 'pendente' | 'em_progresso' | 'concluida' | 'atrasada';
  description: string;
  startDate: string;
  endDate: string;
  reportUrl?: string;
  imageUrl?: string;
  disks?: Disk[];
  updatedAt: any;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'clients')
    );
    return unsubscribe;
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'clients'), {
        ...client,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  return { clients, loading, addClient, deleteClient };
}

export function useMigrations() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'migrations'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setMigrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Migration)));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'migrations')
    );
    return unsubscribe;
  }, []);

  const addMigration = async (migration: Omit<Migration, 'id' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, 'migrations'), {
        ...migration,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'migrations');
    }
  };

  const updateMigration = async (id: string, data: Partial<Migration>) => {
    try {
      await updateDoc(doc(db, 'migrations', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `migrations/${id}`);
    }
  };

  const deleteMigration = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'migrations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `migrations/${id}`);
    }
  };

  return { migrations, loading, addMigration, updateMigration, deleteMigration };
}
