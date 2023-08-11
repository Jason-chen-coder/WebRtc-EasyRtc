
<template>
  <div class="home-view">
    <RouterLink to="/pushStream">
      <el-button type="primary" size="large" class="home-btn">
        推流
      </el-button>
    </RouterLink>

    <RouterLink to="/pullStream">
      <el-button type="primary" color="#626aef" size="large" class="home-btn">
        拉流
      </el-button>
    </RouterLink>
  </div>
</template>
<script>
export default {

  methods: {
  },
  data() {
    return {
      num: 1
    }
  }
}
</script>
<style scoped>
.home-view {
  display: flex;
  margin: 0 auto;
  font-weight: normal;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: space-around;
}

.home-btn {
  width: 300px;
  height: 100px;
  font-size: 50px;
}
</style>
