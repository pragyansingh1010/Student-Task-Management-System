function validTaskTitle(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

console.assert(validTaskTitle('Finish project'));
console.assert(!validTaskTitle(''));
console.assert(!validTaskTitle('   '));
console.log('Task state tests passed');
