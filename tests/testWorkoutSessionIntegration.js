// Test script for WorkoutSession integration
// Run this in the browser console to test the new architecture

async function testWorkoutSessionIntegration() {
    console.log('🧪 Testing WorkoutSession Integration...\n');
    
    // Test 1: Check if WorkoutSession can be imported
    console.log('1️⃣ Testing WorkoutSession import...');
    try {
        const { WorkoutSession } = await import('../core/WorkoutSession.js');
        console.log('✅ WorkoutSession imported successfully');
        console.log('   Class type:', typeof WorkoutSession);
    } catch (error) {
        console.error('❌ Failed to import WorkoutSession:', error);
        return;
    }
    
    // Test 2: Check if WorkoutExecutionManager exists
    console.log('\n2️⃣ Testing WorkoutExecutionManager...');
    if (window.workoutExecutionManager) {
        console.log('✅ WorkoutExecutionManager exists');
        console.log('   Has navegarParaTelaWorkout:', typeof window.workoutExecutionManager.navegarParaTelaWorkout === 'function');
        console.log('   Has checkActiveSession:', typeof window.workoutExecutionManager.checkActiveSession === 'function');
        console.log('   Has getSessionData:', typeof window.workoutExecutionManager.getSessionData === 'function');
    } else {
        console.error('❌ WorkoutExecutionManager not found');
    }
    
    // Test 3: Test navigation flow
    console.log('\n3️⃣ Testing navigation to workout screen...');
    try {
        // First ensure we have a workout loaded
        if (!window.workoutExecutionManager.currentWorkout) {
            console.log('⚠️  No workout loaded. Please load a workout first.');
            return;
        }
        
        console.log('📱 Current workout:', window.workoutExecutionManager.currentWorkout.nome);
        console.log('🚀 Attempting navigation...');
        
        await window.workoutExecutionManager.navegarParaTelaWorkout();
        
        // Check if WorkoutSession was created
        if (window.workoutExecutionManager.workoutSession) {
            console.log('✅ WorkoutSession created successfully');
            console.log('   isInitialized:', window.workoutExecutionManager.workoutSession.isInitialized);
            console.log('   currentWorkout:', window.workoutExecutionManager.workoutSession.currentWorkout?.nome);
        } else {
            console.error('❌ WorkoutSession was not created');
        }
        
        // Check DOM elements
        console.log('\n4️⃣ Checking DOM elements...');
        const workoutScreen = document.getElementById('workout-screen');
        const restModal = document.getElementById('rest-timer-overlay');
        const exercisesContainer = document.getElementById('exercises-expanded') || document.getElementById('exercises-container');
        
        console.log('   Workout screen:', workoutScreen ? '✅ Found' : '❌ Not found');
        console.log('   Rest modal:', restModal ? '✅ Found' : '❌ Not found');
        console.log('   Exercises container:', exercisesContainer ? '✅ Found' : '❌ Not found');
        
        if (exercisesContainer) {
            const exerciseCards = exercisesContainer.querySelectorAll('.exercise-card');
            console.log('   Exercise cards:', exerciseCards.length > 0 ? `✅ ${exerciseCards.length} cards` : '❌ No cards');
        }
        
    } catch (error) {
        console.error('❌ Navigation failed:', error);
    }
    
    console.log('\n✅ Test complete!');
}

// Function to test series confirmation
async function testSeriesConfirmation(exerciseIndex = 0, seriesIndex = 0) {
    console.log('🧪 Testing series confirmation...\n');
    
    if (!window.workoutExecutionManager || !window.workoutExecutionManager.workoutSession) {
        console.error('❌ WorkoutSession not initialized. Run testWorkoutSessionIntegration() first.');
        return;
    }
    
    try {
        console.log(`📍 Confirming series ${seriesIndex + 1} of exercise ${exerciseIndex + 1}`);
        await window.workoutExecutionManager.confirmarSerie(exerciseIndex, seriesIndex);
        
        // Check if rest modal appeared
        const restModal = document.getElementById('rest-timer-overlay');
        if (restModal && restModal.style.display === 'flex') {
            console.log('✅ Rest timer modal is visible');
            
            const display = document.getElementById('rest-timer-display');
            if (display) {
                console.log('   Timer display:', display.textContent);
            }
        } else {
            console.log('⚠️  Rest timer modal not visible (might be last series)');
        }
        
    } catch (error) {
        console.error('❌ Series confirmation failed:', error);
    }
}

// Function to test state recovery
async function testStateRecovery() {
    console.log('🧪 Testing state recovery...\n');
    
    // Check if there's saved state
    const savedState = localStorage.getItem('workout_state');
    if (savedState) {
        const state = JSON.parse(savedState);
        console.log('✅ Found saved state:');
        console.log('   Workout:', state.workout?.nome);
        console.log('   Executions:', state.executions?.length || 0);
        console.log('   Timestamp:', new Date(state.timestamp).toLocaleString());
    } else {
        console.log('❌ No saved state found');
    }
    
    // Test recovery
    if (window.workoutExecutionManager) {
        const hasActive = await window.workoutExecutionManager.checkActiveSession();
        console.log('\n   Has active session:', hasActive ? '✅ Yes' : '❌ No');
        
        if (hasActive) {
            const sessionData = await window.workoutExecutionManager.getSessionData();
            console.log('   Session data available:', sessionData ? '✅ Yes' : '❌ No');
        }
    }
}

// Export test functions to window for easy access
window.testWorkoutSession = {
    integration: testWorkoutSessionIntegration,
    series: testSeriesConfirmation,
    recovery: testStateRecovery,
    runAll: async function() {
        await testWorkoutSessionIntegration();
        console.log('\n' + '='.repeat(50) + '\n');
        await testStateRecovery();
    }
};

console.log('🎯 WorkoutSession Integration Tests Loaded!');
console.log('Available commands:');
console.log('  testWorkoutSession.integration() - Test basic integration');
console.log('  testWorkoutSession.series(exerciseIndex, seriesIndex) - Test series confirmation');
console.log('  testWorkoutSession.recovery() - Test state recovery');
console.log('  testWorkoutSession.runAll() - Run all tests');