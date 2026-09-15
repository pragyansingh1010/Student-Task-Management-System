function validTitle(title) {
  return title.trim().length > 0;
}

console.assert(validTitle('Finish DBMS'));
console.assert(!validTitle('   '));
