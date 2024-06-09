import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

const WebViewScreen = ({ route }) => {
    const { uri } = route.params;
    return (
        <View style={styles.container}>
            <WebView source={{ uri }} style={styles.webview} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
});

export default WebViewScreen;
