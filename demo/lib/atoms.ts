import { ApiPromise } from '@polkadot/api';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const apiAtom = atom<ApiPromise | null>(null);
export const apiConnectingAtom = atom<boolean>(false);
export const metadataAtom = atom<string | null>(null);

export interface Program {
  id: string
  name: string;
  data: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

// Atom for programs list, persisted in localStorage
export const programsAtom = atomWithStorage<Program[]>("programs", []);

// Add program atom
export const addProgramAtom = atom(
  null,
  (get, set, program: Program) => {
    const programs = get(programsAtom);
    set(programsAtom, [...programs, program]);
  }
);

// Remove program atom (by name)
export const removeProgramAtom = atom(
  null,
  (get, set, id: string) => {
    const programs = get(programsAtom);
    set(programsAtom, programs.filter(p => p.id !== id));
  }
);


// Atom for the currently selected program (object, not id)
export const selectedProgramIdAtom = atom<string | null>(null);

// Derived atom: always returns a valid program (prefer selected, else first, else null)
export const currentProgramAtom = atom((get) => {
  const programs = get(programsAtom);
  const selectedId = get(selectedProgramIdAtom);

  // Check if selected is in programs (by id)
  const found = programs.find(p => p.id === selectedId);
  if (found) return found;

  // Fallback to first program or null
  return programs.length > 0 ? programs[0] : null;
}, (get, set, next: string | null) => {
  set(selectedProgramIdAtom, next);
});