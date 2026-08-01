import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { getDestinations } from '../services/database';
import { getFavorites } from '../services/favorites';
import EnhancedDestinationCard from '../components/EnhancedDestinationCard';
import Loader from '../components/Loader';

export default function SavedDestinationsScreen({ navigation }) {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false);
  const load=useCallback(async()=>{
    try { const [ids,destinations]=await Promise.all([getFavorites(),getDestinations()]); const wanted=new Set(ids); setItems(destinations.filter(item=>wanted.has(item.id))); }
    catch(error){ console.error('Failed to load saved destinations:',error); }
    finally { setLoading(false); setRefreshing(false); }
  },[]);
  useFocusEffect(useCallback(()=>{ load(); },[load]));
  return <SafeAreaView style={styles.container} edges={['top','bottom']}>
    <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.secondary}/></TouchableOpacity><Text style={styles.title}>Saved Destinations</Text><View style={{width:24}}/></View>
    {loading?<Loader/>:<FlatList data={items} keyExtractor={item=>item.id} numColumns={2} contentContainerStyle={styles.list} columnWrapperStyle={styles.row}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}}/>}
      renderItem={({item})=><View style={styles.card}><EnhancedDestinationCard destination={item} onPress={()=>navigation.navigate('DestinationDetail',{destination:item})}/></View>}
      ListEmptyComponent={<View style={styles.empty}><Ionicons name="heart-outline" size={56} color={COLORS.grayLight}/><Text style={styles.emptyTitle}>No saved places</Text><Text style={styles.emptyText}>Tap the heart on a destination to save it here.</Text></View>}/>} 
  </SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:COLORS.backgroundSecondary},header:{height:64,paddingHorizontal:SPACING.lg,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:COLORS.white},title:{fontSize:FONTS.sizes.lg,fontWeight:'800',color:COLORS.secondary},list:{padding:SPACING.md,flexGrow:1},row:{gap:SPACING.md},card:{flex:1,maxWidth:'50%'},empty:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:100},emptyTitle:{fontSize:FONTS.sizes.lg,fontWeight:'800',color:COLORS.secondary,marginTop:SPACING.md},emptyText:{color:COLORS.gray,marginTop:SPACING.xs,textAlign:'center'}});
