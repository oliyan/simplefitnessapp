  // App.tsx
  import React, {useState, useEffect, useRef } from 'react';
  import { View, ActivityIndicator, StatusBar, StyleSheet, Pressable, Text, Platform } from 'react-native'; // Import Platform
  import * as FileSystem from 'expo-file-system';
  import { SQLiteProvider} from 'expo-sqlite';
  import { initDatabase } from './utils/firstLaunch';
  import { Asset } from 'expo-asset';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
  import Ionicons from 'react-native-vector-icons/Ionicons';
  import Home from './screens/Home'; // Assuming you have a Home screen component
  import Workouts from './screens/Workouts';
  import CreateWorkout from './screens/CreateWorkout';
  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import WorkoutDetails from './screens/WorkoutDetails';
  import GeneratePlan from './screens/GeneratePlan';
  import MyCalendar from './screens/MyCalendar';
  import LogWorkout from './screens/LogWorkout';
  import MyProgress from './screens/MyProgress';
  import LogWeights from './screens/LogWeights';
  import WeightLogDetail from './screens/WeightLogDetail';
  import StartedWorkoutInterface from './screens/StartedWorkoutInterface';
  import './utils/i18n'; // Ensure this is present to initialize i18n
  import i18n from './utils/i18n'; // Import the i18n instance
  import { I18nextProvider } from 'react-i18next';
  import Settings from './screens/Settings';
  import { SettingsProvider, useSettings } from './context/SettingsContext';
  import { ThemeProvider, useTheme } from './context/ThemeContext';
  import { PersonalProvider } from './context/PersonalContext';
  import EditWorkout from './screens/EditWorkout';
  import AllLogs from './screens/AllLogs';
  import * as Notifications from 'expo-notifications';
  import SchedulePlan from './screens/SchedulePlan';
  import { checkAndSyncPermissions } from './utils/notificationUtils';
  import { AppState } from 'react-native';
  import GraphsWorkoutDetails from './screens/GraphsWorkoutDetails';
  import ProgressHome from './screens/ProgressHome';
  import ExerciseProgress from './screens/ExerciseProgress';




  const Bottom = createBottomTabNavigator();
  const WorkoutStackScreen = createNativeStackNavigator<WorkoutStackParamList>();
  const WorkoutLogStackScreen= createNativeStackNavigator<WorkoutLogStackParamList>();
  const WeightLogStackScreen= createNativeStackNavigator<WeightLogStackParamList>();
  const StartWorkoutStackScreen = createNativeStackNavigator<StartWorkoutStackParamList>();

  



  

  const resetDatabase = async () => {
    try {
      const dbName = "SimpleDB.db";
      const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;


      // Check if the database file exists
      const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
      if (fileInfo.exists) {
        // Delete the existing database file
        console.log("Deleting existing database...");
        await FileSystem.deleteAsync(dbFilePath, { idempotent: true });
        console.log("Database deleted.");
      }

      // Recreate the database folder if necessary
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}SQLite`,
        { intermediates: true }
      );

      // Initialize a new database (or download a fresh copy)
      const dbAsset = require("./assets/SimpleDB.db");
      const dbUri = Asset.fromModule(dbAsset).uri;

      console.log("Downloading new database...");
      await FileSystem.downloadAsync(dbUri, dbFilePath);
      console.log("New database downloaded.");
    } catch (error) {
      console.error("Error resetting database:", error);
    }
  };



  const loadDatabase = async () => {
    try {
      const dbName = "SimpleDB.db";
      const dbAsset = require("./assets/SimpleDB.db");
      const dbUri = Asset.fromModule(dbAsset).uri;
      const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
  
      const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
  
      if (!fileInfo.exists) {
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}SQLite`,
          { intermediates: true }
        );
        console.log("Downloading database...");
        await FileSystem.downloadAsync(dbUri, dbFilePath);
        
      } else {
        console.log("Database already exists.");
 
      }
    } catch (error) {
      console.error("Error in loadDatabase:", error);
    }
  };


  


  export type WorkoutStackParamList = {
    WorkoutsList: undefined; // No parameters for this route
    CreateWorkout: undefined; // No parameters for this route
    GeneratePlan: undefined;
    SchedulePlan: { workout_id?: number } | undefined;
    WorkoutDetails: { workout_id: number }; // Add this
    EditWorkout: { workout_id: number }; // Only `workout_id` for editing a workout
  };

  export type WorkoutLogStackParamList = {
    MyCalendar: {refresh?:boolean};  // No parameters for this route
    LogWorkout: { selectedDate?: string };
    SchedulePlan: { workout_id?: number } | undefined;
    StartedWorkoutInterface: { workout_log_id: number };
    LogWeights: { workout_log_id?: number };
  };

  export type WeightLogStackParamList = {
    MyProgress: undefined;
    LogWeights: { workout_log_id?: number };
    WeightLogDetail:{ workoutName: string }
    AllLogs: undefined;
    GraphsWorkoutDetails: undefined;
    ProgressHome: undefined;
    ExerciseProgress: { name: string };
  }

  export type StartWorkoutStackParamList = {
    StartWorkout: { fromNotification?: boolean } | undefined;
    StartedWorkoutInterface: { workout_log_id: number };
  }

  function WorkoutStack() {
    return (

      <SQLiteProvider databaseName="SimpleDB.db" useSuspense onInit={initDatabase}>

      <WorkoutStackScreen.Navigator screenOptions={{
        headerShown: false, // Disable headers for all screens in this stack
      }}
    >
        <WorkoutStackScreen.Screen
          name="WorkoutsList"
          component={Workouts}
          options={{ headerShown: false }}
        />
        <WorkoutStackScreen.Screen
          name="CreateWorkout"
          component={CreateWorkout}
          options={{ title: 'Create Workout' }}
        />
        <WorkoutStackScreen.Screen
          name='GeneratePlan'
          component={GeneratePlan}
          options={{ title: 'GeneratePlan' }}
        />
        <WorkoutStackScreen.Screen
          name='WorkoutDetails'
          component={WorkoutDetails}
          options={{title: 'WorkoutDetails'}}
          />
             <WorkoutStackScreen.Screen
          name='EditWorkout'
          component={EditWorkout}
          options={{title: 'EditWorkout'}}
          />
        <WorkoutStackScreen.Screen
          name='SchedulePlan'
          component={SchedulePlan}
          options={{ headerShown: false }}
        />
      </WorkoutStackScreen.Navigator>
      </SQLiteProvider>
    );
  }

  function WorkoutLogStack() {
    return (
      <WorkoutLogStackScreen.Navigator
        screenOptions={{
          headerShown: false, // Disable headers for all screens in this stack
        }}
      >
        <WorkoutLogStackScreen.Screen
          name="MyCalendar"
          component={MyCalendar}
          options={{ headerShown: false }} // No header for MyCalendar screen
        />
        <WorkoutLogStackScreen.Screen
          name="LogWorkout"
          component={LogWorkout}
          options={{ title: 'Log a Workout' }} // Title for the LogWorkout screen
        />
        <WorkoutLogStackScreen.Screen
          name="SchedulePlan"
          component={SchedulePlan}
          options={{ headerShown: false }}
        />
        <WorkoutLogStackScreen.Screen
          name="StartedWorkoutInterface"
          component={StartedWorkoutInterface}
          getId={({ params }) => String(params?.workout_log_id)} // one screen per workout, never a stale one
          options={{ headerShown: false }}
        />
        <WorkoutLogStackScreen.Screen
          name="LogWeights"
          component={LogWeights}
          options={{ headerShown: false }}
        />
      </WorkoutLogStackScreen.Navigator>

      
    );
  }


  function WeightLogStack() {
    return (
      <WeightLogStackScreen.Navigator
        screenOptions={{
          headerShown: false, // Disable headers for all screens in this stack
        }}
      >
        <WeightLogStackScreen.Screen
          name="ProgressHome"
          component={ProgressHome}
          options={{ headerShown: false }}
        />
        <WeightLogStackScreen.Screen
          name="ExerciseProgress"
          component={ExerciseProgress}
          options={{ headerShown: false }}
        />
        <WeightLogStackScreen.Screen
          name="GraphsWorkoutDetails"
          component={GraphsWorkoutDetails}
          options={{ headerShown: false }}
        />
        <WeightLogStackScreen.Screen
          name="MyProgress"
          component={MyProgress}
          options={{ headerShown: false }} // No header for MyCalendar screen
        />
        <WeightLogStackScreen.Screen
          name="LogWeights"
          component={LogWeights}
          options={{ title: 'Log Weights' }} // Title for the LogWorkout screen
        />

  <WeightLogStackScreen.Screen
          name="WeightLogDetail"
          component={WeightLogDetail}
          options={{ headerShown: false }} // No header for MyCalendar screen
        />
      <WeightLogStackScreen.Screen
          name="AllLogs"
          component={AllLogs}
          options={{ headerShown: false }} // No header for MyCalendar screen
        />    
      
      </WeightLogStackScreen.Navigator>
    );
  }

  /*function StartWorkoutStack() {
    return (
      <StartWorkoutStackScreen.Navigator
        screenOptions={{
          headerShown: false, // Disable headers for all screens in this stack
        }}
      >
        <StartWorkoutStackScreen.Screen
          name="StartWorkout"
          component={StartWorkout}
          options={{ headerShown: false }}
        />
        <StartWorkoutStackScreen.Screen
          name="StartedWorkoutInterface"
          component={StartedWorkoutInterface}
          getId={({ params }) => String(params?.workout_log_id)} // one screen per workout, never a stale one
          options={{ headerShown: false }}
        />
      </StartWorkoutStackScreen.Navigator>
    );
  }*/

// Define AppContent here
const AppContent = () => {
  const { theme } = useTheme();
  const { notificationPermissionGranted, setNotificationPermissionGranted } =
    useSettings();

  useEffect(() => {
    if (notificationPermissionGranted) {
      checkAndSyncPermissions(setNotificationPermissionGranted);
    }
  }, [notificationPermissionGranted, setNotificationPermissionGranted]);

  return (
    <>
      <StatusBar barStyle={theme.type === 'light' ? "dark-content" : "light-content"} backgroundColor={theme.background} />
      <React.Suspense
        fallback={
          <View style={{ flex:1 }}>
            <ActivityIndicator size={'large'}/>
          </View>
        }
      />
      <SQLiteProvider databaseName="SimpleDB.db" useSuspense onInit={initDatabase}>
        <Bottom.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.background, // Dynamically set based on theme
              borderTopWidth: 0, // Removes the top border of the tab bar
              elevation: 0, // Removes shadow on Android
              shadowOpacity: 0, // Removes shadow on iOS
              height: 60,
              paddingVertical: 10,
            },
          }}
        >
          <Bottom.Screen
            name="Home"
            component={Home}
            options={{
              tabBarButton: (props) => (
                <TabButton {...props} iconName="home" />
              ),
            }}
          />
          <Bottom.Screen
            name="My Workouts"
            component={WorkoutStack}
            options={{
              tabBarButton: (props) => (
                <TabButton {...props} iconName="clipboard-outline" />
              ),
            }}
          />

          <Bottom.Screen
            name="My Calendar"
            component={WorkoutLogStack}
            options={{
              tabBarButton: (props) => (
                <TabButton {...props} iconName="barbell" />
              ),
            }}
          />

          <Bottom.Screen
            name="My Progress"
            component={WeightLogStack}
            options={{
              tabBarButton: (props) => (
                <TabButton {...props} iconName="trending-up" />
              ),
            }}
          />

       <Bottom.Screen
         name="Settings"
         component={Settings}
         options={{
           tabBarButton: (props) => (
             <TabButton {...props} iconName="settings-sharp" />
           ),
         }}
       />

                 </Bottom.Navigator>
                 </SQLiteProvider>
         </>
  );
};



  export default function App() {
    const [dbLoaded, setDbLoaded] = useState(false);
    const navigationRef = useRef<NavigationContainerRef<any>>(null);
    
    useEffect(() => {
      loadDatabase().then(() => setDbLoaded(true));
      
      // Configure notification permissions
      const setupNotifications = async () => {
        // Don't request permissions on app start - this will be handled when needed
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        
      };
      
      setupNotifications();
      
      return () => {
        // Clean up if needed
      };
    }, []);

    React.useEffect(() => {
      (async () => {
        try {
          // await resetDatabase();
          await loadDatabase();
          setDbLoaded(true);
        } catch (e) {
          console.error("Database loading error:", e);
        }
      })();
    }, []);
  
    if (!dbLoaded) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="black" />
        </View>
      );
    }


    return (
      <ThemeProvider>
      <GestureHandlerRootView>
        <NavigationContainer ref={navigationRef}>
          <SettingsProvider>
          <PersonalProvider>
          <I18nextProvider i18n={i18n}>
          <AppContent/>
          </I18nextProvider>
          </PersonalProvider>
          </SettingsProvider>
         
        </NavigationContainer>
        
      </GestureHandlerRootView>
    </ThemeProvider>
    );
  }

  // Custom TabButton component to handle icon rendering
  const TabButton = (props: any) => {
    const { accessibilityState, onPress } = props;
    const isSelected = accessibilityState?.selected; // Use optional chaining
    const { theme } = useTheme(); // Retrieve the theme here


    return (
      <Pressable onPress={onPress} style={styles.tabButton}>
        <Ionicons
          name={props.iconName}
          size={24}
          color={isSelected ? theme.accent : theme.text}
          style={{ opacity: isSelected ? 1 : 0.7 }}
        />
        <View
          style={{
            height: 2,
            width: '40%',
            backgroundColor: isSelected ? theme.accent : 'transparent',
            marginTop: 5,
            borderRadius: 100,
          }}
        />
      </Pressable>
    );
  };

  const styles = StyleSheet.create({
    tabBar: {
      backgroundColor: '#ffffff',
      borderTopWidth: 2,
      elevation: 10,
      height: 60, // Adjusted height for a larger tab bar
      paddingVertical: 10, // Reduced padding to balance spacing
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 1,
    },
    permissionBanner: {
      backgroundColor: '#FFF9C4',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    permissionText: {
      fontSize: 14,
      color: '#333333',
      textAlign: 'center',
    },
  });