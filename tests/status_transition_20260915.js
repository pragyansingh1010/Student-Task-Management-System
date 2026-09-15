function nextStatus(status) {
  return status === 'pending' ? 'completed' : status;
}

console.assert(nextStatus('pending') === 'completed');
console.assert(nextStatus('completed') === 'completed');
