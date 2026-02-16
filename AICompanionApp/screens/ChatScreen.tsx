import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';

type Message = {
  id: string;
  text: string;
  isMine: boolean;
};

type ApiResponse = {
  reply: string;
};

export default function ChatScreen() {
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const ws = useRef<WebSocket | null>(null);
  
  //==== Socket
  useEffect(() => {
    getAllMessages();
    ws.current = new WebSocket('ws://ec2-3-104-35-93.ap-southeast-2.compute.amazonaws.com:5101');

    ws.current.onopen = () => {
      console.log('WebSocket 연결 열림');
    };

    ws.current.onmessage = (event) => {
      console.log("도착 함?")
      console.log(event.data)
      let receivedText = '';
      if(typeof event.data === 'string'){
        receivedText = JSON.parse(event.data)?.text || '';
      }
      console.log(` receivedText ${receivedText}`)
      setMessages(prev => [...prev, { id: Date.now().toString(), text: receivedText, isMine : false }]);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket 에러:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket 연결 종료');
    };

    return () => {
      ws.current?.close();
    };
  }, []);
  
  const sendMessageToAPI = async () => {
  // const sendMessageToAPI = async (message: string): Promise<string> => {
    try {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, isMine : true }]);
      const res = await fetch('http://ec2-3-104-35-93.ap-southeast-2.compute.amazonaws.com:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message:inputText }),
      });
  
      if (!res.ok) {
        console.error('서버 응답 에러:', res.statusText);
        return '';
      }
      const json: ApiResponse = await res.json();
      console.log("json",json)
      setMessages(prev => [...prev, { id: Date.now().toString(), text: json.reply, isMine : false }]);
      setInputText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('API 호출 실패:', error);
      return '';
    }
  };

  const getAllMessages = async () => {

    try {
        const response = await fetch('http://ec2-3-104-35-93.ap-southeast-2.compute.amazonaws.com:5000/api/chat/history', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        for(let i = data.length-1; i > -1; i--){
          let messageObj = data[i];
          let userMsg = messageObj.user_message;
          setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), text: userMsg, isMine: true },
          ]);
          let botAnswer = messageObj.bot_reply;
          setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), text: botAnswer, isMine: false },
          ]);
        }
        // 서버 응답 메시지 추가
        // setMessages(prev => [
        //     ...prev,
        //     { id: Date.now().toString(), text: data.text, isMine: false },
        // ]);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item, index) => index.toString()}
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
                <Button title="전송" onPress={sendMessageToAPI} />
                {/* <Button title="전송" onPress={sendMessage} /> */}
            </View>
        </View>
      </KeyboardAvoidingView>
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