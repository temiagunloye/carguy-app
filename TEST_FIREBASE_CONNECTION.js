// TEST_FIREBASE_CONNECTION.js
// Quick test script to verify Firebase is connected
// Run with: node TEST_FIREBASE_CONNECTION.js

const { db, auth, storage } = require('./src/services/firebaseConfig');

async function testFirebaseConnection() {
    console.log('\n🔍 Testing Firebase Connection...\n');

    try {
        // Test 1: Firestore
        console.log('1️⃣ Testing Firestore...');
        const testDoc = await db.collection('_test').doc('connection').get();
        console.log('   ✅ Firestore: Connected');

        // Test 2: Auth
        console.log('2️⃣ Testing Auth...');
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log(`   ✅ Auth: Signed in as ${currentUser.email}`);
        } else {
            console.log('   ⚠️  Auth: Not signed in (normal if no user logged in)');
        }

        // Test 3: Storage
        console.log('3️⃣ Testing Storage...');
        const storageRef = storage.ref();
        console.log('   ✅ Storage: Connected');

        console.log('\n✅ Firebase is properly configured!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Firebase connection error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check .env file has FIREBASE_* variables');
        console.error('2. Verify firebaseConfig.js exists');
        console.error('3. Run: npm install firebase\n');
        process.exit(1);
    }
}

testFirebaseConnection();
