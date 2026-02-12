import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import ChatScreen from './screens/ChatScreen';

export default function App() {
  return <ChatScreen/>;
  // return (
  //   <View style={styles.container}>
  //     <Text>Open up App.tsx to start working on your app!</Text>
  //     <StatusBar style="auto" />
  //   </View>
  // );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
