import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoImage } from '../utils/imageUtils';
import * as RNIap from 'react-native-iap';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import 'react-native-url-polyfill/auto';

function PurchaseSubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [iapReady, setIapReady] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    let purchaseListener;
    let iapInitialized = false;

    const initializeIAP = async () => {
      try {
        if (!iapInitialized) {
          await RNIap.initConnection();
          iapInitialized = true;
          setIapReady(true);
          setInitError(null);
        }
        await loadProducts();
      } catch (error) {
        console.error('Error initializing IAP:', error);
        setInitError(error.message);
        Alert.alert('Error', 'Failed to initialize store. Please try again later.');
      }
    };

    const setupPurchaseListener = () => {
      purchaseListener = RNIap.setTransactionListener(({ responseCode, results, errorCode }) => {
        if (responseCode === RNIap.IAPResponseCode.OK) {
          results.forEach(async (purchase) => {
            if (!purchase.acknowledged) {
              try {
                // Call Supabase Edge Function
                const { data, error } = await supabase.functions.invoke('validate-receipt', {
                  body: {
                    user_id: user.id,
                    receipt_data: purchase.transactionReceipt,
                    product_id: purchase.productId
                  }
                });

                if (error) throw error;

                // Acknowledge the purchase
                await RNIap.finishTransaction(purchase);
                
                Alert.alert('Success', 'Subscription activated successfully!');
                router.replace('/settings');
              } catch (error) {
                console.error('Error validating receipt:', error);
                Alert.alert('Error', 'Failed to validate purchase');
              }
            }
          });
        }
      });
    };

    // Initialize IAP with retry
    const initWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await initializeIAP();
          break;
        } catch (error) {
          if (i === retries - 1) {
            console.error('Failed to initialize IAP after retries:', error);
            setInitError(error.message);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };

    initWithRetry();
    setupPurchaseListener();

    return () => {
      if (purchaseListener) {
        purchaseListener.remove();
      }
      if (iapInitialized) {
        RNIap.endConnection();
      }
    };
  }, [user]);

  const loadProducts = async () => {
    try {
      const { responseCode, results } = await RNIap.getProducts([
        'goonsquad28', // Monthly
        'goonsquad29'  // Yearly
      ]);
      
      if (responseCode === RNIap.IAPResponseCode.OK) {
        setProducts(results);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    }
  };

  const handlePurchase = async () => {
    if (!iapReady) {
      Alert.alert('Error', 'Store is not ready yet. Please try again in a moment.');
      return;
    }

    try {
      setLoading(true);
      const productId = selectedPlan === 'yearly' ? 'goonsquad29' : 'goonsquad28';
      await RNIap.buyProduct(productId);
    } catch (error) {
      console.error('Error making purchase:', error);
      Alert.alert('Error', 'Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const { responseCode, results } = await RNIap.getPurchaseHistory();
      
      if (responseCode === RNIap.IAPResponseCode.OK) {
        if (results.length === 0) {
          Alert.alert('No Purchases', 'No previous purchases found.');
          return;
        }

        // Check each purchase
        for (const purchase of results) {
          const { data, error } = await supabase.functions.invoke('validate-receipt', {
            body: {
              user_id: user.id,
              receipt_data: purchase.transactionReceipt,
              product_id: purchase.productId
            }
          });

          if (!error) {
            Alert.alert('Success', 'Purchases restored successfully!');
            router.replace('/settings');
            return;
          }
        }
        
        Alert.alert('No Valid Purchases', 'No valid purchases found to restore.');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$9.99',
      period: 'month',
      features: [
        'Guided audio for mental sessions',
        'Create unlimited workouts',
        '100 AI trainer messages/day',
        'Custom calorie & water goals',
        'Premium workout plans',
        'Priority support'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$59.99',
      period: 'year',
      savings: 'Save 50%',
      features: [
        'Everything in Monthly plan',
        'Save 50% compared to monthly',
        'Early access to new features',
        'Exclusive premium content',
        'Priority support'
      ]
    }
  ];

  const renderPlanCard = (plan) => {
    const isSelected = selectedPlan === plan.id;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planCard, isSelected && styles.selectedPlanCard]}
        onPress={() => setSelectedPlan(plan.id)}
      >
        {plan.savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{plan.savings}</Text>
          </View>
        )}
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.period}>/{plan.period}</Text>
          </View>
        </View>
        <View style={styles.featureList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#00ffff" style={{ marginRight: 8 }} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/settings')}>
        <Ionicons name="chevron-back" size={28} color="#00ffff" />
        <Text style={styles.backButtonText}>Back to Settings</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <LogoImage size={120} style={styles.logo} />
        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>Choose your plan and unlock all features</Text>
      </View>

      <View style={styles.plansContainer}>
        {plans.map(renderPlanCard)}
      </View>

      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={handlePurchase}
        disabled={loading}
      >
        <LinearGradient
          colors={['#00ffff', '#0088ff']}
          style={styles.subscribeButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              Subscribe {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.restoreButton} 
        onPress={handleRestorePurchases}
        disabled={loading}
      >
        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
      </TouchableOpacity>

      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => Linking.openURL('https://yourapp.com/terms')}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={{ color: '#00ffff', marginHorizontal: 8 }}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://yourapp.com/privacy')}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 140,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  plansContainer: {
    gap: 20,
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  selectedPlanCard: {
    borderColor: '#00ffff',
    borderWidth: 2,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#00ffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  planHeader: {
    marginBottom: 15,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffff',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  featureList: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  subscribeButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  restoreButton: {
    marginTop: 18,
    marginBottom: 10,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#00ffff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  linksContainer: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#00ffff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default PurchaseSubscriptionScreen; 