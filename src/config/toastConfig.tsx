import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {BaseToast, BaseToastProps} from 'react-native-toast-message';
import {theme} from '../theme';
import Icon from 'react-native-vector-icons/Feather';

export const toastConfig = {
  error: (props: BaseToastProps) => (
    <View style={styles.errorToast}>
      <View style={styles.toastContent}>
        <Icon name="x-circle" size={20} color={theme.colors.white} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.errorText1}>{props.text1}</Text>
          {props.text2 && <Text style={styles.errorText2}>{props.text2}</Text>}
        </View>
      </View>
    </View>
  ),
  success: (props: BaseToastProps) => (
    <View style={styles.successToast}>
      <View style={styles.toastContent}>
        <Icon name="check-circle" size={20} color={theme.colors.white} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.successText1}>{props.text1}</Text>
          {props.text2 && <Text style={styles.successText2}>{props.text2}</Text>}
        </View>
      </View>
    </View>
  ),
  info: (props: BaseToastProps) => (
    <View style={styles.infoToast}>
      <View style={styles.toastContent}>
        <Icon name="info" size={20} color={theme.colors.gray500} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.infoText1}>{props.text1}</Text>
          {props.text2 && <Text style={styles.infoText2}>{props.text2}</Text>}
        </View>
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  errorToast: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: '90%',
    alignSelf: 'center',
    ...theme.shadows.md,
  },
  successToast: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: '90%',
    alignSelf: 'center',
    ...theme.shadows.md,
  },
  infoToast: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    ...theme.shadows.md,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  errorText1: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  errorText2: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
    opacity: 0.9,
  },
  successText1: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  successText2: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
    opacity: 0.9,
  },
  infoText1: {
    color: theme.colors.gray700,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  infoText2: {
    color: theme.colors.gray500,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
  },
});