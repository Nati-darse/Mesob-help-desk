// Clear all mesob-related data from localStorage
// Run this in browser console: clearMesobData()

function clearMesobData() {
    localStorage.removeItem('mesob_user');
    console.log('✅ Mesob user data cleared from localStorage');
    console.log('🔄 Refreshing page...');
    window.location.reload();
}

// Export for easy access
window.clearMesobData = clearMesobData;
console.log('💡 To clear user data and test routing, run: clearMesobData()');
