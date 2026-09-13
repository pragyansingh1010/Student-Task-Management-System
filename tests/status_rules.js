function validStatus(value) {
  return ['pending', 'in-progress', 'completed'].includes(value);
}

console.assert(validStatus('pending'));
console.assert(validStatus('in-progress'));
console.assert(validStatus('completed'));
console.assert(!validStatus('unknown'));
console.log('Task status rules passed');
