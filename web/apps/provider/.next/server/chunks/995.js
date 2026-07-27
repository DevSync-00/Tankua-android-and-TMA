"use strict";exports.id=995,exports.ids=[995],exports.modules={4995:(e,t,a)=>{a.d(t,{AT:()=>i,IR:()=>m,K0:()=>o,Mg:()=>b,N1:()=>s,Nd:()=>u,Ph:()=>l,Rt:()=>_,createTrip:()=>p,dH:()=>y,i1:()=>c,jT:()=>f,q8:()=>n,r9:()=>v,tM:()=>g,zu:()=>d});var r=a(8110);async function s(e){let t=new Date;t.setHours(0,0,0,0);let a=new Date(t.getFullYear(),t.getMonth(),1),[s,i,n]=await Promise.all([r.supabase.from("bookings").select("id",{count:"exact",head:!0}).gte("created_at",t.toISOString()),r.supabase.from("bookings").select("total_price").eq("payment_status","paid").gte("created_at",a.toISOString()),r.supabase.from("providers").select("rating, total_trips").eq("id",e).single()]),o=i.data?.reduce((e,t)=>e+(t.total_price||0),0)||0,{count:d}=await r.supabase.from("trips").select("id",{count:"exact",head:!0}).eq("provider_id",e).eq("status","upcoming"),c=new Date(t);c.setDate(c.getDate()-1);let{count:u}=await r.supabase.from("bookings").select("id",{count:"exact",head:!0}).eq("provider_id",e).gte("created_at",c.toISOString()).lt("created_at",t.toISOString()),p=s.count||0,l=u||0,_=new Date(t.getFullYear(),t.getMonth()-1,1),m=new Date(t.getFullYear(),t.getMonth(),0),{data:g}=await r.supabase.from("bookings").select("total_price").eq("provider_id",e).eq("payment_status","paid").gte("created_at",_.toISOString()).lte("created_at",m.toISOString()),f=g?.reduce((e,t)=>e+(t.total_price||0),0)||0;return{todayBookings:p,monthlyEarnings:o,activeTrips:d||0,averageRating:n.data?.rating||0,bookingsChange:l>0?Math.round((p-l)/l*100):p>0?100:0,earningsChange:f>0?Math.round((o-f)/f*100):o>0?100:0}}async function i(e,t=3){let a=r.supabase.from("trips").select(`
      id,
      departure_date,
      date,
      max_seats,
      available_seats,
      status,
      destinations (name)
    `).eq("provider_id",e).in("status",["upcoming","active"]).limit(t);try{a=a.order("departure_date",{ascending:!0})}catch{a=a.order("date",{ascending:!0})}let{data:s,error:i}=await a;if(i){if(i.message?.includes("departure_date")||"42703"===i.code){let{data:a,error:s}=await r.supabase.from("trips").select(`
          id,
          date,
          max_seats,
          available_seats,
          status,
          destinations (name)
        `).eq("provider_id",e).in("status",["upcoming","active"]).order("date",{ascending:!0}).limit(t);return s?(console.error("Error fetching upcoming trips:",s),[]):(a||[]).map(e=>{let t=e.max_seats||0,a=e.date?new Date(e.date):null;return{id:e.id,destination:e.destinations?.name||"Unknown",date:a?a.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"TBD",time:a?a.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0}):"TBD",passengers:t-(e.available_seats||0),capacity:t,driver:"Unassigned",vehicle:"Vehicle",status:e.status}})}return console.error("Error fetching upcoming trips:",i),[]}return(s||[]).map(e=>{let t=e.departure_date||e.date,a=e.max_seats||0,r=t?new Date(t):null;return{id:e.id,destination:e.destinations?.name||"Unknown",date:r?r.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"TBD",time:r?r.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0}):"TBD",passengers:a-(e.available_seats||0),capacity:a,driver:e.drivers?.name||"Unassigned",vehicle:"Vehicle",status:e.status}})}async function n(e,t=4){let{data:a,error:s}=await r.supabase.from("bookings").select(`
      id,
      seats,
      total_price,
      status,
      created_at,
      users (name),
      trips!inner (
        provider_id,
        destinations (name)
      )
    `).eq("trips.provider_id",e).order("created_at",{ascending:!1}).limit(t);return s?(console.error("Error fetching recent bookings:",s),[]):(a||[]).map(e=>{let t;let a=new Date,r=new Date(e.created_at),s=a.getTime()-r.getTime(),i=Math.floor(s/6e4),n=Math.floor(s/36e5);return t=i<60?`${i}m ago`:n<24?`${n}h ago`:`${Math.floor(n/24)}d ago`,{id:e.id.substring(0,8),customer:e.users?.name||"Unknown",destination:e.trips?.destinations?.name||"Unknown",seats:e.seats,amount:e.total_price,time:t,status:e.status}})}async function o(e,t=3){try{let{data:a,error:s}=await r.supabase.from("reviews").select(`
        id,
        rating,
        comment,
        created_at,
        users (name),
        bookings (
          trips (
            destinations (name)
          )
        )
      `).eq("provider_id",e).eq("is_visible",!0).order("created_at",{ascending:!1}).limit(t);if(s)return console.error("Error fetching recent reviews:",s),[];return(a||[]).map(e=>{let t;let a=new Date,r=new Date(e.created_at),s=a.getTime()-r.getTime(),i=Math.floor(s/864e5);return t=0===i?"today":1===i?"1 day ago":`${i} days ago`,{customer:(e.users?.name||"Anonymous").split(" ").map(e=>e[0]).join("")+".",rating:e.rating||5,comment:e.comment||"No comment",trip:e.bookings?.trips?.destinations?.name||"Unknown",date:t}})}catch(e){return console.error("Error fetching recent reviews:",e),[]}}async function d(e,t){let a=r.supabase.from("bookings").select(`
      id,
      seats,
      total_price,
      status,
      payment_status,
      created_at,
      pickup_station,
      destination_id,
      destination_name,
      provider_id,
      users (id, name, phone_number),
      trips (
        id,
        departure_date,
        provider_id,
        destinations (id, name)
      )
    `,{count:"exact"}).eq("provider_id",e).order("created_at",{ascending:!1});t?.status&&(a=a.eq("status",t.status)),t?.limit&&(a=a.limit(t.limit)),t?.offset&&(a=a.range(t.offset,t.offset+(t.limit||10)-1));let{data:s,error:i,count:n}=await a;return i?(console.error("Error fetching provider bookings:",i),{bookings:[],total:0}):{bookings:(s||[]).map(e=>({id:e.id,user:e.users,trip:e.trips?{id:e.trips.id,departure_date:e.trips.departure_date,destination:e.trips.destinations}:null,pickup_station:e.pickup_station,destination_id:e.destination_id,destination_name:e.destination_name,seats:e.seats,total_price:e.total_price,status:e.status,payment_status:e.payment_status,created_at:e.created_at})),total:n||0}}async function c(e,t){let{error:a}=await r.supabase.from("bookings").update(t).eq("id",e);return a?(console.error("Error updating booking status:",a),{success:!1,error:a.message}):{success:!0}}async function u(e,t){let a=r.supabase.from("trips").select(`
      id,
      destination_id,
      departure_date,
      date,
      return_date,
      trip_type,
      price,
      max_seats,
      available_seats,
      status,
      tour_category,
      itinerary,
      destinations (id, name, city, region)
    `,{count:"exact"}).eq("provider_id",e);try{a=a.order("departure_date",{ascending:!1})}catch{a=a.order("date",{ascending:!1})}t?.status&&(a=a.eq("status",t.status)),t?.limit&&(a=a.limit(t.limit)),t?.offset&&(a=a.range(t.offset,t.offset+(t.limit||10)-1));let{data:s,error:i,count:n}=await a;return i?(console.error("Error fetching provider trips:",i),{trips:[],total:0}):{trips:(s||[]).map(e=>({id:e.id,destination_id:e.destination_id||e.destinations?.id||null,destination:e.destinations||null,departure_date:e.departure_date||e.date,return_date:e.return_date,trip_type:e.trip_type,price:e.price,max_seats:e.max_seats||0,available_seats:e.available_seats||0,status:e.status,tour_category:e.tour_category,itinerary:e.itinerary,bookings_count:(e.max_seats||0)-(e.available_seats||0)})),total:n||0}}async function p(e){let t={provider_id:e.provider_id,destination_id:e.destination_id,trip_type:e.trip_type,price:e.price,max_seats:e.max_seats,available_seats:e.max_seats,status:"upcoming"};e.tour_category&&(t.tour_category=e.tour_category),e.itinerary&&(t.itinerary=e.itinerary),t.departure_date=e.departure_date,t.date=e.departure_date.split("T")[0],e.return_date&&(t.return_date=e.return_date);let{data:a,error:s}=await r.supabase.from("trips").insert(t).select("id").single();if(s)return console.error("Error creating trip:",s),{success:!1,error:s.message};if(e.pickup_stations?.length){let{error:t}=await r.supabase.from("trip_pickup_stations").insert(e.pickup_stations.map(e=>({trip_id:a.id,station_id:e.station_id,pickup_time:e.pickup_time,extra_price:e.extra_price})));if(t)return await r.supabase.from("trips").delete().eq("id",a.id),{success:!1,error:`Trip was not created: ${t.message}`}}return{success:!0,id:a.id}}async function l(e,t){let{error:a}=await r.supabase.from("trip_pickup_stations").delete().eq("trip_id",e);if(a)return{success:!1,error:a.message};if(!t.length)return{success:!0};let{error:s}=await r.supabase.from("trip_pickup_stations").insert(t.map(t=>({trip_id:e,...t})));return s?{success:!1,error:s.message}:{success:!0}}async function _(e,t){let a={...t};if(t.departure_date&&(a.departure_date=t.departure_date,a.date=t.departure_date.split("T")[0]),void 0!==t.max_seats&&void 0===t.available_seats){let{data:s}=await r.supabase.from("trips").select("max_seats, available_seats").eq("id",e).single();if(s){let e=t.max_seats-s.max_seats;a.available_seats=Math.max(0,s.available_seats+e)}}let{error:s}=await r.supabase.from("trips").update(a).eq("id",e);return s?(console.error("Error updating trip:",s),{success:!1,error:s.message}):{success:!0}}async function m(e){let{data:t,error:a}=await r.supabase.from("bookings").select("id").eq("trip_id",e).limit(1);if(a)return console.error("Error checking bookings:",a),{success:!1,error:"Failed to check trip bookings"};if(t&&t.length>0)return{success:!1,error:"Cannot delete trip with existing bookings"};let{error:s}=await r.supabase.from("trips").delete().eq("id",e);return s?(console.error("Error deleting trip:",s),{success:!1,error:s.message}):{success:!0}}async function g(e,t){let{error:a}=await r.supabase.from("trips").update({status:t}).eq("id",e);return a?(console.error("Error updating trip status:",a),{success:!1,error:a.message}):{success:!0}}async function f(e){let{data:t,error:a}=await r.supabase.from("drivers").select("*").eq("provider_id",e).order("name");return a?(console.error("Error fetching drivers:",a),[]):t}async function b(e){let{error:t}=await r.supabase.from("drivers").delete().eq("id",e);return t?(console.error("Error deleting driver:",t),{success:!1,error:t.message}):{success:!0}}async function v(e,t){let{error:a}=await r.supabase.from("drivers").update({status:t}).eq("id",e);return!a||(console.error("Error updating driver status:",a),!1)}async function y(e){let t=new Date,a=new Date(t.getFullYear(),t.getMonth()-6,1),s=new Date(t.getFullYear(),t.getMonth(),1),{data:i}=await r.supabase.from("bookings").select("total_price, created_at, payment_status").eq("provider_id",e).eq("payment_status","paid"),{data:n}=await r.supabase.from("bookings").select("total_price, created_at").eq("provider_id",e).eq("payment_status","paid").gte("created_at",a.toISOString()),{data:o}=await r.supabase.from("bookings").select("total_price").eq("provider_id",e).eq("payment_status","paid").gte("created_at",s.toISOString()),{data:d}=await r.supabase.from("bookings").select("total_price").eq("provider_id",e).eq("payment_status","paid").in("status",["pending","confirmed"]),c=new Date(t.getTime()-6048e5),{data:u}=await r.supabase.from("bookings").select("total_price, created_at").eq("provider_id",e).eq("payment_status","paid").eq("status","completed").lt("created_at",c.toISOString()).order("created_at",{ascending:!1}).limit(1).single(),p=i?.reduce((e,t)=>e+(t.total_price||0),0)||0;o?.reduce((e,t)=>e+(t.total_price||0),0);let l=d?.reduce((e,t)=>e+(t.total_price||0),0)||0,_=u?.total_price||0,m=u?.created_at||null,g={},f=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];for(let e=5;e>=0;e--)g[f[new Date(t.getFullYear(),t.getMonth()-e,1).getMonth()]]=0;return n?.forEach(e=>{let t=f[new Date(e.created_at).getMonth()];void 0!==g[t]&&(g[t]+=e.total_price||0)}),{totalEarnings:p,pendingPayout:l,lastPayout:_,lastPayoutDate:m,monthlyData:Object.entries(g).map(([e,t])=>({month:e,earnings:t}))}}}};