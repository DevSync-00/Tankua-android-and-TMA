import React,{useEffect,useState} from 'react';
import {View,Text,StyleSheet,TouchableOpacity,Switch,Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../config/supabase';
import {useAuth} from '../contexts/AuthContext';
import {useFeedback} from '../contexts/FeedbackContext';
import {COLORS,FONTS,SPACING,BORDER_RADIUS} from '../config/theme';

export default function NotificationPreferencesScreen({navigation}){
 const {user}=useAuth(); const {showToast}=useFeedback(); const [prefs,setPrefs]=useState({push_enabled:true,sms_enabled:false}); const [saving,setSaving]=useState(false);
 useEffect(()=>{(async()=>{if(!user?.id)return;const {data}=await supabase.from('user_notification_preferences').select('push_enabled,sms_enabled').eq('user_id',user.id).maybeSingle();if(data)setPrefs(data);})();},[user?.id]);
 const update=async(key,value)=>{const next={...prefs,[key]:value};setPrefs(next);setSaving(true);const {error}=await supabase.from('user_notification_preferences').upsert({user_id:user.id,...next,updated_at:new Date().toISOString()},{onConflict:'user_id'});setSaving(false);if(error){setPrefs(prefs);showToast({type:'error',title:'Could not save',message:error.message});}};
 return <SafeAreaView style={s.container}><View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.secondary}/></TouchableOpacity><Text style={s.title}>Notification Settings</Text><View style={{width:24}}/></View><View style={s.content}>
  <Row icon="notifications-outline" title="Push Notifications" subtitle="Booking, payment, and trip updates" value={prefs.push_enabled} onChange={v=>update('push_enabled',v)}/>
  <Row icon="chatbubble-outline" title="SMS Notifications" subtitle="Important updates by text message" value={prefs.sms_enabled} onChange={v=>update('sms_enabled',v)}/>
  {saving&&<Text style={s.saving}>Saving…</Text>}
 </View></SafeAreaView>;
}
const Row=({icon,title,subtitle,value,onChange})=><View style={s.row}><View style={s.icon}><Ionicons name={icon} size={22} color={COLORS.primary}/></View><View style={{flex:1}}><Text style={s.rowTitle}>{title}</Text><Text style={s.sub}>{subtitle}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{true:COLORS.primary}}/></View>;
const s=StyleSheet.create({container:{flex:1,backgroundColor:COLORS.backgroundSecondary},header:{height:64,paddingHorizontal:SPACING.lg,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:COLORS.white},title:{fontSize:FONTS.sizes.lg,fontWeight:'800',color:COLORS.secondary},content:{padding:SPACING.lg,gap:SPACING.md},row:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.white,padding:SPACING.md,borderRadius:BORDER_RADIUS.xl},icon:{width:42,height:42,borderRadius:21,backgroundColor:`${COLORS.primary}15`,alignItems:'center',justifyContent:'center',marginRight:SPACING.md},rowTitle:{fontSize:FONTS.sizes.md,fontWeight:'700',color:COLORS.secondary},sub:{fontSize:FONTS.sizes.sm,color:COLORS.gray,marginTop:2},saving:{textAlign:'center',color:COLORS.gray}});
