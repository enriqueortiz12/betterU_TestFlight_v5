import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as RNIap from 'react-native-iap';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function PurchaseScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    setupPurchaseListener();
  }, []);

  const loadProducts = async () => {
    try {
      await RNIap.initConnection();
      const { responseCode, results } = await RNIap.getProducts([
        'goonsquad28',
        'goonsquad29'
      ]);
      
      if (responseCode === RNIap.IAPResponseCode.OK) {
        setProducts(results);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    }
  };

  const setupPurchaseListener = () => {
    const subscription = RNIap.setPurchaseListener(({ responseCode, results, errorCode }) => {
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
              await RNIap.finishTransaction(purchase, true);
              
              Alert.alert('Success', 'Subscription activated successfully!');
            } catch (error) {
              console.error('Error validating receipt:', error);
              Alert.alert('Error', 'Failed to validate purchase');
            }
          }
        });
      }
    });

    return () => {
      subscription.remove();
      RNIap.endConnection();
    };
  };

  const handlePurchase = async (productId) => {
    try {
      setLoading(true);
      await RNIap.buyProduct(productId);
    } catch (error) {
      console.error('Error making purchase:', error);
      Alert.alert('Error', 'Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Plan</Text>
      {products.map((product) => (
        <TouchableOpacity
          key={product.productId}
          style={styles.productButton}
          onPress={() => handlePurchase(product.productId)}
          disabled={loading}
        >
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productPrice}>{product.priceString}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  productButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  productTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#fff',
    fontSize: 16,
    marginTop: 5,
  },
}); 