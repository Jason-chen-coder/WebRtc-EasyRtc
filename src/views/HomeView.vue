
<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="12">
        <RouterLink to="/pushStream">
          <el-button type="primary" size="large">
            推流
          </el-button>
        </RouterLink>
      </el-col>
      <el-col :span="12">
        <RouterLink to="/videoMeeting">
          <el-button type="primary" color="#626aef" size="large">
            会议
          </el-button>
        </RouterLink>
      </el-col>
    </el-row>
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
<style scoped></style>
