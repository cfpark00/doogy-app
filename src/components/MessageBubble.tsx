import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Message} from '../types';
import {theme} from '../theme';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({message}) => {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.lg + 2,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
  },
  assistantBubble: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  text: {
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },
  userText: {
    color: theme.colors.white,
  },
  assistantText: {
    color: theme.colors.textPrimary,
  },
});