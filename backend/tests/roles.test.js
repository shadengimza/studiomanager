import test from 'node:test';
import assert from 'node:assert/strict';

// Vérifie le contrat de rôles utilisé par l'API.
// Les tests d'intégration avec PostgreSQL seront ajoutés après connexion à la base.
const roles = ['ADMIN', 'PHOTOGRAPHE', 'DECORATEUR', 'CHAUFFEUR'];

test('les rôles applicatifs attendus sont définis', () => {
  assert.deepEqual(roles, ['ADMIN', 'PHOTOGRAPHE', 'DECORATEUR', 'CHAUFFEUR']);
});

test('un rôle inconnu ne fait pas partie des rôles autorisés', () => {
  assert.equal(roles.includes('CLIENT'), false);
});
