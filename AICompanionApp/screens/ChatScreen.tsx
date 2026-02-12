import React, { useState, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = {
  id: string;
  text: string;
  isMine: boolean;
};

export default function ChatScreen() {
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
  
    try {
        const response = await fetch('http://localhost:5000/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: inputText }),
        });
        const data = await response.json();
  
          setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, isMine : true }]);
        setInputText('');
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  const renderItem: ListRenderItem<Message> = ({ item }) => {
    const isMyMessage = item.isMine; // 메시지 객체에 isMine 같은 boolean 프로퍼티 추가
    return(
        <View style={[
            styles.messageBox,
            isMyMessage ? styles.myMessage : styles.otherMessage
            ]}>
            <Text>{item.text}</Text>
        </View>
    );
    
  };

  return (
    <SafeAreaView style={{ flex:1 }}>
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ref={flatListRef}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            <View style={styles.inputArea}>
                <TextInput
                style={styles.input}
                placeholder="메시지를 입력하세요."
                value={inputText}
                onChangeText={setInputText}
                />
                <Button title="전송" onPress={sendMessage} />
            </View>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10},
  messageBox: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '70%',
  },
  myMessage: {
    backgroundColor: '#aee1f9',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#eaeaea',
    alignSelf: 'flex-start',
  },
  inputArea: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, paddingHorizontal: 10, height: 40 },
});