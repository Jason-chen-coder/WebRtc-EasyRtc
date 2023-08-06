
<template>
  <main>
  选择摄像头 ：
  <div class="enlarge_img" style="display:none;"><img src="" @load="getImageSize" class="enlarge img img"/></div>
  </main>
</template>
<script>
export default{
 async created(){
    const res = await  navigator.mediaDevices.enumerateDevices();
    console.log(res,'==========>res')
  },  
  methods:{
  },
  data() {
    return{
      num:1
    }
  }
}
</script>
