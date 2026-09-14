const allowed = ['pending', 'in-progress', 'completed'];

console.assert(allowed.includes('pending'));
console.assert(allowed.includes('in-progress'));
console.assert(allowed.includes('completed'));
console.assert(!allowed.includes('unknown'));
console.log('Task status rules passed');
