'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  setDoc(docRef, data, options || {}).catch(error => {
    // Check if the error is a permission error before creating the custom error
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: operation,
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
    } else {
        // Handle other types of errors (e.g., network issues) if necessary
        console.error("Firestore setDoc failed:", error);
    }
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: colRef.path, // Note: This is the collection path, not a document path
              operation: 'create',
              requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("Firestore addDoc failed:", error);
        }
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
             console.error("Firestore updateDoc failed:", error);
        }
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("Firestore deleteDoc failed:", error);
        }
    });
}

// NOTE: It seems you're using `updateDoc` directly in `edit-user-dialog.tsx`.
// For consistency with the non-blocking pattern, you might want to use
// `updateDocumentNonBlocking` instead. However, since the dialog likely
// closes upon successful submission and shows a toast, the current async/await
// pattern with try/catch is also a valid and common UI approach.
// I've ensured the catch block in edit-user-dialog.tsx now correctly
// emits the detailed FirestorePermissionError. If you want to switch to
// fully non-blocking, you would replace the try/catch with a call to
// `updateDocumentNonBlocking(userRef, updatedPayload);` and handle UI
// feedback optimistically.
