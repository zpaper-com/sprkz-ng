module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global mocks or resources
  if (global.gc) {
    global.gc();
  }
  
  // Restore console methods
  if (console.log.mockRestore) {
    console.log.mockRestore();
    console.debug.mockRestore();
    console.info.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  }
  
  console.log('✅ Test environment cleanup complete');
};