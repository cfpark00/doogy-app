import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {theme} from '../theme';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textPlaceholder}
          multiline
          maxHeight={100}
          editable={!disabled}
        />
        <TouchableOpacity
          style={[styles.sendButton, disabled && styles.disabledButton]}
          onPress={handleSend}
          disabled={disabled || !message.trim()}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.xl,
    fontSize: theme.fontSize.md,
    marginRight: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg - 4,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});