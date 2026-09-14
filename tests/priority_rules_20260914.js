const priorities = ['low', 'medium', 'high'];

console.assert(priorities.includes('low'));
console.assert(priorities.includes('medium'));
console.assert(priorities.includes('high'));
console.assert(!priorities.includes('urgent'));
console.log('Task priority rules passed');
