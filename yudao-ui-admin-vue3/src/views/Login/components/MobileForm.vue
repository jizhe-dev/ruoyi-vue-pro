<script setup lang="ts">
import { useIcon } from '@/hooks/web/useIcon'
import { reactive, ref, unref, watch, computed } from 'vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { ElForm, ElFormItem, ElInput, ElRow, ElCol, ElMessage } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { required } from '@/utils/formRules'
import {
  getTenantIdByNameApi,
  getAsyncRoutesApi,
  sendSmsCodeApi,
  smsLoginApi,
  getInfoApi
} from '@/api/login'
import { useCache } from '@/hooks/web/useCache'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import { setToken } from '@/utils/auth'
import { useUserStoreWithOut } from '@/store/modules/user'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { useLoginState, LoginStateEnum, useFormValid } from './useLogin'
const formSmsLogin = ref()
const { validForm } = useFormValid(formSmsLogin)
const { handleBackLogin, getLoginState } = useLoginState()
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.MOBILE)
const iconHouse = useIcon({ icon: 'ep:house' })
const iconCellphone = useIcon({ icon: 'ep:cellphone' })
const iconCircleCheck = useIcon({ icon: 'ep:circle-check' })
const { wsCache } = useCache()
const userStore = useUserStoreWithOut()
const permissionStore = usePermissionStore()
const { currentRoute, addRoute, push } = useRouter()
const loginLoading = ref(false)
const { t } = useI18n()

const rules = {
  tenantName: [required],
  mobileNumber: [required],
  code: [required]
}
const loginData = reactive({
  codeImg: '',
  tenantEnable: true,
  token: '',
  loading: {
    signIn: false
  },
  loginForm: {
    uuid: '',
    tenantName: '芋道源码',
    mobileNumber: '',
    code: ''
  }
})
const smsVO = reactive({
  smsCode: {
    mobile: '',
    scene: 21
  },
  loginSms: {
    mobile: '',
    code: ''
  }
})
const mobileCodeTimer = ref(0)
const redirect = ref<string>('')
const getSmsCode = async () => {
  await getTenantId()
  smsVO.smsCode.mobile = loginData.loginForm.mobileNumber
  console.log('getSmsCode begin:', smsVO.smsCode)
  await sendSmsCodeApi(smsVO.smsCode)
    .then(async (res) => {
      // 提示验证码发送成功
      ElMessage({
        type: 'success',
        message: t('login.SmsSendMsg')
      })
      console.log('res', res)
      // 设置倒计时
      mobileCodeTimer.value = 60
      let msgTimer = setInterval(() => {
        mobileCodeTimer.value = mobileCodeTimer.value - 1
        if (mobileCodeTimer.value <= 0) {
          clearInterval(msgTimer)
        }
      }, 1000)
    })
    .catch(() => {
      console.log('error')
    })
}
watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)
// 获取租户 ID
const getTenantId = async () => {
  const res = await getTenantIdByNameApi(loginData.loginForm.tenantName)
  wsCache.set('tenantId', res)
}
// 登录
const signIn = async () => {
  await getTenantId()
  const data = await validForm()
  if (!data) return
  loginLoading.value = true
  smsVO.loginSms.mobile = loginData.loginForm.mobileNumber
  smsVO.loginSms.code = loginData.loginForm.code
  await smsLoginApi(smsVO.loginSms)
    .then(async (res) => {
      setToken(res?.token)
      const userInfo = await getInfoApi()
      await userStore.getUserInfoAction(userInfo)
      getRoutes()
    })
    .catch(() => {})
    .finally(() => {
      loginLoading.value = false
    })
}
// 获取路由
const getRoutes = async () => {
  // 后端过滤菜单
  // TODO @jinz：这块 getRoutes 的代码，是不是可以统一到 store 里，类似 ruoyi-vue 的做法，可能要找作者沟通下
  const routers = await getAsyncRoutesApi()
  wsCache.set('roleRouters', routers)
  await permissionStore.generateRoutes(routers).catch(() => {})
  permissionStore.getAddRouters.forEach((route) => {
    addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
  })
  permissionStore.setIsAddRouters(true)
  push({ path: redirect.value || permissionStore.addRouters[0].path })
}
</script>
<template>
  <el-form
    :model="loginData.loginForm"
    :rules="rules"
    label-position="top"
    class="login-form"
    label-width="120px"
    size="large"
    v-show="getShow"
    ref="formSmsLogin"
  >
    <el-row style="margin-left: -10px; margin-right: -10px">
      <!-- 租户名 -->
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <LoginFormTitle style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item prop="tenantName">
          <el-input
            type="text"
            v-model="loginData.loginForm.tenantName"
            :placeholder="t('login.tenantNamePlaceholder')"
            :prefix-icon="iconHouse"
          />
        </el-form-item>
      </el-col>
      <!-- 手机号 -->
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item prop="mobileNumber">
          <el-input
            v-model="loginData.loginForm.mobileNumber"
            :placeholder="t('login.mobileNumberPlaceholder')"
            :prefix-icon="iconCellphone"
          />
        </el-form-item>
      </el-col>
      <!-- 验证码 -->
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item prop="code">
          <el-row justify="space-between" style="width: 100%" :gutter="5">
            <el-col :span="24">
              <el-input
                v-model="loginData.loginForm.code"
                :placeholder="t('login.codePlaceholder')"
                :prefix-icon="iconCircleCheck"
              >
                <!-- <el-button class="w-[100%]"> -->
                <template #append>
                  <span
                    v-if="mobileCodeTimer <= 0"
                    @click="getSmsCode"
                    class="getMobileCode"
                    style="cursor: pointer"
                  >
                    {{ t('login.getSmsCode') }}
                  </span>
                  <span v-if="mobileCodeTimer > 0" class="getMobileCode" style="cursor: pointer">
                    {{ mobileCodeTimer }}秒后可重新获取
                  </span>
                </template>
              </el-input>
              <!-- </el-button> -->
            </el-col>
          </el-row>
        </el-form-item>
      </el-col>
      <!-- 登录按钮 / 返回按钮 -->
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <el-button :loading="loginLoading" type="primary" class="w-[100%]" @click="signIn">
            {{ t('login.login') }}
          </el-button>
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <el-button :loading="loginLoading" class="w-[100%]" @click="handleBackLogin">
            {{ t('login.backLogin') }}
          </el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<style lang="less" scoped>
:deep(.anticon) {
  &:hover {
    color: var(--el-color-primary) !important;
  }
}

.smsbtn {
  margin-top: 33px;
}
</style>
