import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,TextInput,Image,KeyboardAvoidingView,Platform,ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {COLORS,FONTS,SPACING,BORDER_RADIUS,SHADOWS} from '../config/theme';
import {supabase} from '../config/supabase';
import {useAuth} from '../contexts/AuthContext';

export default function CloseFriendsScreen({navigation}){
 const {user}=useAuth();
 const [friends,setFriends]=useState([]); const [query,setQuery]=useState('');
 const [showForm,setShowForm]=useState(false); const [phone,setPhone]=useState('');
 const [loading,setLoading]=useState(true); const [adding,setAdding]=useState(false); const [toast,setToast]=useState('');
 const notify=message=>{setToast(message);setTimeout(()=>setToast(''),2600);};
 const load=useCallback(async()=>{if(!user?.id)return setLoading(false);const {data,error}=await supabase.rpc('get_my_close_friends');if(error)notify(error.message);else setFriends(data||[]);setLoading(false);},[user?.id]);
 useEffect(()=>{load();},[load]);
 const visible=useMemo(()=>friends.filter(friend=>`${friend.name||''} ${friend.phone||''}`.toLowerCase().includes(query.trim().toLowerCase())),[friends,query]);
 const add=async()=>{if(phone.trim().length<7)return notify('Enter a valid phone number');setAdding(true);const {error}=await supabase.rpc('add_close_friend_by_phone',{requested_phone:phone.trim()});if(error)notify(error.message);else{await load();notify('Friend added');setPhone('');setShowForm(false);}setAdding(false);};
 const remove=async id=>{const {error}=await supabase.from('close_friends').delete().eq('id',id).eq('user_id',user.id);if(error)notify(error.message);else{await load();notify('Friend removed');}};
 return <SafeAreaView style={s.page} edges={['top','bottom']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={s.header}><TouchableOpacity style={s.headerButton} onPress={()=>navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.secondary}/></TouchableOpacity><Text style={s.headerTitle}>Close Friends</Text><View style={s.headerButton}/></View>
  <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
   {showForm&&<View style={s.form}>
    <View style={s.formHead}><Text style={s.formTitle}>Add a close friend</Text><TouchableOpacity style={s.close} onPress={()=>{setShowForm(false);setPhone('');}}><Ionicons name="close" size={18} color={COLORS.secondary}/></TouchableOpacity></View>
    <Text style={s.formCopy}>Enter the phone number linked to their Tankua account.</Text>
    <Text style={s.label}>Phone number</Text><TextInput autoFocus style={s.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+251 9XX XXX XXX" placeholderTextColor={COLORS.grayLight}/>
    <TouchableOpacity style={[s.continue,adding&&s.disabled]} disabled={adding} onPress={add}>{adding?<ActivityIndicator color={COLORS.secondary}/>:<Text style={s.continueText}>Save friend</Text>}</TouchableOpacity>
   </View>}
   <View style={s.search}><Ionicons name="search" size={18} color={COLORS.gray}/><TextInput style={s.searchInput} value={query} onChangeText={setQuery} placeholder="Search friends..." placeholderTextColor={COLORS.grayLight}/></View>
   {loading?<ActivityIndicator style={{marginTop:60}} color={COLORS.primary}/>:visible.length===0?<View style={s.empty}><View style={s.emptyIcon}><Ionicons name="people-outline" size={40} color={COLORS.primary}/></View><Text style={s.emptyTitle}>No friends found</Text><Text style={s.emptyCopy}>Add friends to see their trips and travel together</Text></View>:visible.map(friend=><View key={friend.id} style={s.card}>
    {friend.photo_url?<Image source={{uri:friend.photo_url}} style={s.avatar}/>:<View style={s.avatar}><Text style={s.initial}>{(friend.name||'T')[0].toUpperCase()}</Text></View>}
    <View style={s.info}><Text style={s.name}>{friend.name||'Tankua traveler'}</Text><Text style={s.friendPhone}>{friend.phone||''}</Text><Text style={s.trips}>{friend.trips_together||0} trips together</Text></View>
    <TouchableOpacity style={s.remove} onPress={()=>remove(friend.id)}><Ionicons name="close" size={18} color={COLORS.error}/></TouchableOpacity>
   </View>)}
  </ScrollView>
  <View style={s.sticky}><TouchableOpacity style={s.continue} onPress={()=>setShowForm(true)}><Text style={s.continueText}>Add Friend</Text></TouchableOpacity></View>
  {toast?<View style={s.toast}><Text style={s.toastText}>{toast}</Text></View>:null}
 </KeyboardAvoidingView></SafeAreaView>;
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:COLORS.backgroundSecondary},header:{height:64,backgroundColor:COLORS.white,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:SPACING.md,borderBottomWidth:1,borderBottomColor:COLORS.borderLight},headerButton:{width:40,height:40,alignItems:'center',justifyContent:'center'},headerTitle:{fontSize:FONTS.sizes.xl,fontWeight:'800',color:COLORS.secondary},body:{padding:SPACING.md,paddingBottom:110,flexGrow:1},
 form:{backgroundColor:COLORS.white,borderWidth:1,borderColor:'rgba(255,184,0,.25)',borderRadius:18,padding:SPACING.md,marginBottom:SPACING.md,...SHADOWS.small},formHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:SPACING.sm},formTitle:{fontSize:FONTS.sizes.md,fontWeight:'800',color:COLORS.secondary},close:{width:32,height:32,borderRadius:10,backgroundColor:COLORS.backgroundSecondary,alignItems:'center',justifyContent:'center'},formCopy:{fontSize:FONTS.sizes.xs,color:COLORS.gray,lineHeight:18,marginBottom:SPACING.md},label:{fontSize:FONTS.sizes.xs,fontWeight:'800',color:COLORS.secondary},phone:{height:46,marginTop:6,marginBottom:SPACING.md,paddingHorizontal:12,borderWidth:1,borderColor:COLORS.borderLight,borderRadius:12,backgroundColor:'#FDFCF9',fontSize:FONTS.sizes.md,color:COLORS.secondary},
 search:{height:48,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.borderLight,borderRadius:14,flexDirection:'row',alignItems:'center',paddingHorizontal:SPACING.md,gap:SPACING.sm,marginBottom:SPACING.md},searchInput:{flex:1,fontSize:FONTS.sizes.md,color:COLORS.secondary},card:{minHeight:76,backgroundColor:COLORS.white,borderRadius:16,padding:SPACING.md,marginBottom:SPACING.sm,flexDirection:'row',alignItems:'center',...SHADOWS.small},avatar:{width:46,height:46,borderRadius:23,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',marginRight:SPACING.md},initial:{fontSize:FONTS.sizes.lg,fontWeight:'800',color:COLORS.secondary},info:{flex:1},name:{fontSize:FONTS.sizes.md,fontWeight:'800',color:COLORS.secondary},friendPhone:{fontSize:FONTS.sizes.sm,color:COLORS.gray,marginTop:2},trips:{fontSize:FONTS.sizes.xs,color:COLORS.grayLight,marginTop:2},remove:{width:38,height:38,alignItems:'center',justifyContent:'center'},
 empty:{alignItems:'center',justifyContent:'center',paddingVertical:70},emptyIcon:{width:74,height:74,borderRadius:37,backgroundColor:`${COLORS.primary}18`,alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:FONTS.sizes.xl,fontWeight:'800',color:COLORS.secondary,marginTop:SPACING.md},emptyCopy:{fontSize:FONTS.sizes.sm,color:COLORS.gray,textAlign:'center',marginTop:SPACING.xs},sticky:{position:'absolute',left:0,right:0,bottom:0,padding:SPACING.md,backgroundColor:COLORS.white,borderTopWidth:1,borderTopColor:COLORS.borderLight},continue:{height:50,borderRadius:14,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},continueText:{fontSize:FONTS.sizes.md,fontWeight:'800',color:COLORS.secondary},disabled:{opacity:.55},toast:{position:'absolute',left:SPACING.lg,right:SPACING.lg,bottom:90,backgroundColor:COLORS.secondary,borderRadius:12,padding:SPACING.md,...SHADOWS.medium},toastText:{color:COLORS.white,textAlign:'center',fontWeight:'700'}
});
