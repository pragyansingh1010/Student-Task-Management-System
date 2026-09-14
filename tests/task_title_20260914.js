function validTitle(title) {
  return typeof title === 'string' && title.trim().length > 0;
}

console.assert(validTitle('Study DBMS'));
console.assert(!validTitle(''));
console.assert(!validTitle('   '));
console.log('Task title rules passed');
