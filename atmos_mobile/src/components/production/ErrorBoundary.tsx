import React, { ReactNode, Component } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Button } from '../common';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays graceful error UI
 * Production-ready error handling with retry capability
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: Spacing.lg,
            }}
          >
            {/* Error Icon */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: Colors.errorDim,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Spacing.xl,
              }}
            >
              <Text style={{ fontSize: 48 }}>⚠️</Text>
            </View>

            {/* Error Title */}
            <Text
              style={[
                Typography.displayMd,
                { color: Colors.error, marginBottom: Spacing.md, textAlign: 'center' },
              ]}
            >
              Something went wrong
            </Text>

            {/* Error Description */}
            <Text
              style={[
                Typography.bodySm,
                {
                  color: Colors.textMuted,
                  marginBottom: Spacing.xl,
                  textAlign: 'center',
                  lineHeight: 22,
                },
              ]}
            >
              We encountered an unexpected error. Our team has been notified.
            </Text>

            {/* Error Message (Dev Only) */}
            {__DEV__ && this.state.error && (
              <View
                style={{
                  backgroundColor: Colors.bgInput,
                  borderRadius: Radius.md,
                  padding: Spacing.md,
                  marginBottom: Spacing.xl,
                  width: '100%',
                  borderLeftWidth: 3,
                  borderLeftColor: Colors.error,
                }}
              >
                <Text
                  style={[
                    Typography.monoSm,
                    { color: Colors.error, marginBottom: Spacing.xs },
                  ]}
                  numberOfLines={2}
                >
                  {this.state.error.message}
                </Text>
              </View>
            )}

            {/* Retry Button */}
            <Button label="Try Again" onPress={this.handleReset} size="lg" style={{ width: '100%' }} />
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}
