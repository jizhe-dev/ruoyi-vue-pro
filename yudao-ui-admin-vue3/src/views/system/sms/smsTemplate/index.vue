<script setup lang="ts">
import { reactive, ref, unref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { DICT_TYPE } from '@/utils/dict'
import { useTable } from '@/hooks/web/useTable'
import { useI18n } from '@/hooks/web/useI18n'
import { FormExpose } from '@/components/Form'
import type { SmsTemplateVO } from '@/api/system/sms/smsTemplate/types'
import { rules, allSchemas } from './sms.template.data'
import * as SmsTemplateApi from '@/api/system/sms/smsTemplate'
const { t } = useI18n() // 国际化

// ========== 列表相关 ==========
const { register, tableObject, methods } = useTable<SmsTemplateVO>({
  getListApi: SmsTemplateApi.getSmsTemplatePageApi,
  delListApi: SmsTemplateApi.deleteSmsTemplateApi
})
const { getList, setSearchParams, delList } = methods

// ========== CRUD 相关 ==========
const loading = ref(false) // 遮罩层
const actionType = ref('') // 操作按钮的类型
const dialogVisible = ref(false) // 是否显示弹出层
const dialogTitle = ref('edit') // 弹出层标题
const formRef = ref<FormExpose>() // 表单 Ref

// 设置标题
const setDialogTile = (type: string) => {
  dialogTitle.value = t('action.' + type)
  actionType.value = type
  dialogVisible.value = true
}

// 新增操作
const handleCreate = () => {
  setDialogTile('create')
  // 重置表单
  unref(formRef)?.getElFormRef()?.resetFields()
}

// 修改操作
const handleUpdate = async (row: SmsTemplateVO) => {
  setDialogTile('update')
  // 设置数据
  const res = await SmsTemplateApi.getSmsTemplateApi(row.id)
  unref(formRef)?.setValues(res)
}

// 提交按钮
const submitForm = async () => {
  loading.value = true
  // 提交请求
  try {
    const data = unref(formRef)?.formModel as SmsTemplateVO
    if (actionType.value === 'create') {
      await SmsTemplateApi.createSmsTemplateApi(data)
      ElMessage.success(t('common.createSuccess'))
    } else {
      await SmsTemplateApi.updateSmsTemplateApi(data)
      ElMessage.success(t('common.updateSuccess'))
    }
    // 操作成功，重新加载列表
    dialogVisible.value = false
    await getList()
  } finally {
    loading.value = false
  }
}

// 删除操作
const handleDelete = (row: SmsTemplateVO) => {
  delList(row.id, false)
}

// ========== 详情相关 ==========
const detailRef = ref() // 详情 Ref

// 详情操作
const handleDetail = async (row: SmsTemplateVO) => {
  // 设置数据
  detailRef.value = row
  setDialogTile('detail')
}
const sendSmsForm = reactive({
  content: '',
  params: '',
  mobile: '',
  templateCode: '',
  templateParams: {}
})
// TODO 发送短信
// ========== 测试相关 ==========
const handleSendSms = (row: any) => {
  sendSmsForm.content = row.content
  sendSmsForm.params = row.params
  sendSmsForm.templateCode = row.code
  sendSmsForm.templateParams = row.params.reduce(function (obj, item) {
    obj[item] = undefined
    return obj
  }, {})
}

// ========== 初始化 ==========
getList()
</script>

<template>
  <!-- 搜索工作区 -->
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
  </ContentWrap>
  <ContentWrap>
    <!-- 操作工具栏 -->
    <div class="mb-10px">
      <el-button type="primary" v-hasPermi="['system:sms-channel:create']" @click="handleCreate">
        <Icon icon="ep:zoom-in" class="mr-5px" /> {{ t('action.add') }}
      </el-button>
    </div>
    <!-- 列表 -->
    <Table
      :columns="allSchemas.tableColumns"
      :selection="false"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{
        total: tableObject.total
      }"
      v-model:pageSize="tableObject.pageSize"
      v-model:currentPage="tableObject.currentPage"
      @register="register"
    >
      <template #type="{ row }">
        <DictTag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="row.type" />
      </template>
      <template #status="{ row }">
        <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
      </template>
      <template #createTime="{ row }">
        <span>{{ dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>
      <template #action="{ row }">
        <el-button
          link
          type="primary"
          v-hasPermi="['system:sms-template:send-sms']"
          @click="handleSendSms(row)"
        >
          <Icon icon="ep:cpu" class="mr-5px" /> {{ t('action.test') }}
        </el-button>
        <el-button
          link
          type="primary"
          v-hasPermi="['system:sms-template:update']"
          @click="handleUpdate(row)"
        >
          <Icon icon="ep:edit" class="mr-5px" /> {{ t('action.edit') }}
        </el-button>
        <el-button
          link
          type="primary"
          v-hasPermi="['system:sms-template:update']"
          @click="handleDetail(row)"
        >
          <Icon icon="ep:view" class="mr-5px" /> {{ t('action.detail') }}
        </el-button>
        <el-button
          link
          type="primary"
          v-hasPermi="['system:sms-template:delete']"
          @click="handleDelete(row)"
        >
          <Icon icon="ep:delete" class="mr-5px" /> {{ t('action.del') }}
        </el-button>
      </template>
    </Table>
  </ContentWrap>

  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <!-- 对话框(添加 / 修改) -->
    <Form
      v-if="['create', 'update'].includes(actionType)"
      :schema="allSchemas.formSchema"
      :rules="rules"
      ref="formRef"
    />
    <!-- 对话框(详情) -->
    <Descriptions
      v-if="actionType === 'detail'"
      :schema="allSchemas.detailSchema"
      :data="detailRef"
    >
      <template #type="{ row }">
        <DictTag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="row.code" />
      </template>
      <template #status="{ row }">
        <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
      </template>
      <template #createTime="{ row }">
        <span>{{ dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>
    </Descriptions>
    <!-- 操作按钮 -->
    <template #footer>
      <el-button
        v-if="['create', 'update'].includes(actionType)"
        type="primary"
        :loading="loading"
        @click="submitForm"
      >
        {{ t('action.save') }}
      </el-button>
      <el-button @click="dialogVisible = false">{{ t('dialog.close') }}</el-button>
    </template>
  </Dialog>
</template>
