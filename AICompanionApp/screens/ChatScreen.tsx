import React, { useState, useRef, useEffect } from 'react';
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
  const ws = useRef<WebSocket | null>(null);
  
  //==== Socket
  useEffect(() => {
    ws.current = new WebSocket('ws://ec2-3-104-35-93.ap-southeast-2.compute.amazonaws.com:5101');

    ws.current.onopen = () => {
      console.log('WebSocket 연결 열림');
    };

    ws.current.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]);
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

  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, isMine : true }]);
    setInputText('');
    setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
        const response = await fetch('ec2-3-104-35-93.ap-southeast-2.compute.amazonaws.com:5000/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: inputText }),
        });
        const data = await response.json();

        // 서버 응답 메시지 추가
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), text: data.text, isMine: false },
        ]);
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    } catch (error) {
        console.error('메시지 전송 실패:', error);
    }
  };
// ======= 폴링 방식
//   // 3초마다 서버에 메시지 요청하는 폴링
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch('http://ec2-13-236-201-252.ap-southeast-2.compute.amazonaws.com:5000/api/messages',{
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ text: '' }),
//         });
//         const data = await res.json();
//         console.log('폴링 중 오류:', data);
//         // setMessages(data);
//         setMessages(prev => [
//             ...prev,
//             { id: Date.now().toString(), text: data.text, isMine: false },
//         ]);
//       } catch (error) {
//         console.error('폴링 중 오류:', error);
//       }
//     }, 3000); // 3초 주기

//     return () => clearInterval(interval); // 언마운트 시 정리
//   }, []);

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