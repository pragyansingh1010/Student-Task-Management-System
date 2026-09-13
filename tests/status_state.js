function validStatus(status) {
  return ['todo', 'in-progress', 'done'].includes(status);
}

console.assert(validStatus('todo'));
console.assert(validStatus('in-progress'));
console.assert(validStatus('done'));
console.assert(!validStatus('unknown'));
console.log('Task status tests passed');
