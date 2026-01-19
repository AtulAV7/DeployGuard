import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Gradients, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { sendChatMessage } from '@/services/api';
import type { ChatMessage } from '@/types';

export default function ChatScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: `👋 Hi! I'm your AI DevOps assistant.

I can help you:
• Diagnose server issues
• Explain error messages
• Suggest fixes and optimizations
• Run quick actions

**Try asking:**
"Why is my CPU so high?"
"What's wrong with the database?"
"Restart the worker"`,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const sentText = inputText.trim();
        setInputText('');
        Keyboard.dismiss();

        setIsTyping(true);

        try {
            const response = await sendChatMessage(sentText);

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                actions: sentText.toLowerCase().includes('restart') ? undefined : [
                    { id: '1', label: 'View Server', type: 'navigation', payload: '/servers/3' },
                    { id: '2', label: 'Run Fix', type: 'command', payload: 'restart' },
                ],
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error connecting to the server. Please make sure the backend is running on port 3001.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickPrompt = (text: string) => {
        setInputText(text);
    };

    const handleAction = async (action: { type: string; payload: string; label: string }) => {
        if (action.type === 'command' && action.payload === 'restart') {
            setIsTyping(true);
            const response = await sendChatMessage('restart the worker');

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            }]);
            setIsTyping(false);
        } else {
            Alert.alert('Navigation', `Would navigate to ${action.payload}`);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
                {!isUser && (
                    <LinearGradient
                        colors={Gradients.primary as [string, string]}
                        style={styles.avatar}
                    >
                        <Ionicons name="hardware-chip" size={16} color="#fff" />
                    </LinearGradient>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : { backgroundColor: colors.surface },
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? '#fff' : colors.text },
                    ]}>
                        {item.content}
                    </Text>

                    {item.actions && item.actions.length > 0 && (
                        <View style={styles.actionsContainer}>
                            {item.actions.map(action => (
                                <TouchableOpacity
                                    key={action.id}
                                    style={styles.actionButton}
                                    onPress={() => handleAction(action)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={action.type === 'command' ? 'play' : 'arrow-forward'}
                                        size={14}
                                        color={StatusColors.primary}
                                    />
                                    <Text style={styles.actionLabel}>{action.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const QuickPrompt = ({ text }: { text: string }) => (
        <TouchableOpacity
            style={[styles.quickPrompt, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => handleQuickPrompt(text)}
            activeOpacity={0.7}
        >
            <Text style={[styles.quickPromptText, { color: colors.text }]}>{text}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <LinearGradient
                            colors={Gradients.primary as [string, string]}
                            style={styles.headerIcon}
                        >
                            <Ionicons name="hardware-chip" size={20} color="#fff" />
                        </LinearGradient>
                        <View>
                            <Text style={[styles.title, { color: colors.text }]}>AI Assistant</Text>
                            <Text style={[styles.subtitle, { color: StatusColors.success }]}>● Online</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setMessages([messages[0]])}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                showsVerticalScrollIndicator={true}
                style={styles.flatList}
                ListFooterComponent={
                    isTyping ? (
                        <View style={styles.typingIndicator}>
                            <LinearGradient
                                colors={Gradients.primary as [string, string]}
                                style={styles.typingAvatar}
                            >
                                <Ionicons name="hardware-chip" size={12} color="#fff" />
                            </LinearGradient>
                            <View style={[styles.typingBubble, { backgroundColor: colors.surface }]}>
                                <Text style={{ color: colors.textSecondary }}>Thinking...</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Quick prompts */}
            {messages.length === 1 && (
                <View style={styles.quickPrompts}>
                    <QuickPrompt text="Why is CPU high?" />
                    <QuickPrompt text="Check memory" />
                    <QuickPrompt text="Restart worker" />
                </View>
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        placeholder="Ask about your servers..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || isTyping}
                        activeOpacity={0.8}
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
                        ]}
                    >
                        <LinearGradient
                            colors={inputText.trim() && !isTyping ? Gradients.primary as [string, string] : ['#475569', '#334155']}
                            style={styles.sendButtonGradient}
                        >
                            <Ionicons name="send" size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                {/* Spacer for tab bar */}
                <View style={[styles.tabBarSpacer, { backgroundColor: colors.surface }]} />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.sm,
    },
    title: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: Layout.fontSize.sm,
    },
    menuButton: {
        padding: 8,
    },
    flatList: {
        flex: 1,
    },
    messageList: {
        paddingHorizontal: Layout.spacing.md,
        paddingBottom: Layout.spacing.md,
        paddingTop: Layout.spacing.sm,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: Layout.spacing.md,
        alignItems: 'flex-start',
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.sm,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: Layout.spacing.md,
        borderRadius: Layout.radius.lg,
    },
    userBubble: {
        backgroundColor: StatusColors.primary,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: Layout.fontSize.md,
        lineHeight: 22,
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: Layout.spacing.sm,
        gap: Layout.spacing.xs,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    actionLabel: {
        color: StatusColors.primary,
        fontSize: Layout.fontSize.sm,
        fontWeight: '500',
        marginLeft: 4,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: Layout.spacing.sm,
    },
    typingAvatar: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.sm,
    },
    typingBubble: {
        padding: Layout.spacing.md,
        borderRadius: Layout.radius.lg,
    },
    quickPrompts: {
        flexDirection: 'row',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        gap: Layout.spacing.sm,
    },
    quickPrompt: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    quickPromptText: {
        fontSize: Layout.fontSize.sm,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Layout.spacing.md,
        paddingTop: Layout.spacing.sm,
        paddingBottom: Layout.spacing.sm,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        borderRadius: Layout.radius.md,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: 10,
        fontSize: Layout.fontSize.md,
        marginRight: Layout.spacing.sm,
    },
    sendButton: {
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBarSpacer: {
        height: Platform.OS === 'ios' ? 80 : 60,
    },
});
