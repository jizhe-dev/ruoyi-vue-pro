<script setup lang="ts">
import { ref, unref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElTag, ElSelect, ElOption } from 'element-plus'
import { DICT_TYPE } from '@/utils/dict'
import { useTable } from '@/hooks/web/useTable'
import { useI18n } from '@/hooks/web/useI18n'
import { FormExpose } from '@/components/Form'
import type { TenantVO } from '@/api/system/tenant/types'
import { rules, allSchemas } from './tenant.data'
import * as TenantApi from '@/api/system/tenant'
import { getTenantPackageList } from '@/api/system/tenantPackage'
import { TenantPackageVO } from '@/api/system/tenantPackage/types'
const { t } = useI18n() // 国际化

// ========== 列表相关 ==========
const { register, tableObject, methods } = useTable<TenantVO>({
  getListApi: TenantApi.getTenantPageApi,
  delListApi: TenantApi.deleteTenantApi,
  exportListApi: TenantApi.exportTenantApi
})
const { getList, setSearchParams, delList, exportList } = methods

// 导出操作
const handleExport = async () => {
  await exportList('租户数据.xls')
}
// ========== 套餐 ==========
const tenantPackageId = ref() // 套餐
const tenantPackageOptions = ref<TenantPackageVO[]>([]) //套餐列表

const getTenantPackageOptions = async () => {
  const res = await getTenantPackageList()
  tenantPackageOptions.value.push(...res)
}
const getPackageName = (packageId: number) => {
  for (let item of tenantPackageOptions.value) {
    if (item.id === packageId) {
      return item.name
    }
  }
  return '未知套餐'
}
// ========== CRUD 相关 ==========
const actionLoading = ref(false) // 遮罩层
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
  tenantPackageId.value = ''
  unref(formRef)?.getElFormRef()?.resetFields()
}

// 修改操作
const handleUpdate = async (row: any) => {
  setDialogTile('update')
  // 设置数据
  const res = await TenantApi.getTenantApi(row.id)
  tenantPackageId.value = res.packageId
  res.expireTime = dayjs(res.expireTime).format('YYYY-MM-DD HH:mm:ss')
  unref(formRef)?.setValues(res)
}

// 提交按钮
const submitForm = async () => {
  actionLoading.value = true
  // 提交请求 unix()
  try {
    const data = unref(formRef)?.formModel as TenantVO
    data.packageId = tenantPackageId.value
    if (actionType.value === 'create') {
      data.expireTime = dayjs(data.expireTime).valueOf().toString()
      await TenantApi.createTenantApi(data)
      ElMessage.success(t('common.createSuccess'))
    } else {
      data.expireTime = dayjs(data.expireTime).valueOf().toString()
      await TenantApi.updateTenantApi(data)
      ElMessage.success(t('common.updateSuccess'))
    }
    // 操作成功，重新加载列表
    dialogVisible.value = false
    await getList()
  } finally {
    actionLoading.value = false
  }
}

// 删除操作
const handleDelete = (row: TenantVO) => {
  delList(row.id, false)
}

// ========== 详情相关 ==========
const detailRef = ref() // 详情 Ref

// 详情操作
const handleDetail = async (row: any) => {
  // 设置数据
  detailRef.value = row
  setDialogTile('detail')
}

// ========== 初始化 ==========
onMounted(async () => {
  await getList()
  await getTenantPackageOptions()
})
</script>

<template>
  <!-- 搜索工作区 -->
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
  </ContentWrap>
  <ContentWrap>
    <!-- 操作工具栏 -->
    <div class="mb-10px">
      <el-button type="primary" v-hasPermi="['system:tenant:create']" @click="handleCreate">
        <Icon icon="ep:zoom-in" class="mr-5px" /> {{ t('action.add') }}
      </el-button>
      <el-button
        type="warning"
        v-hasPermi="['system:tenant:export']"
        :loading="tableObject.exportLoading"
        @click="handleExport"
      >
        <Icon icon="ep:download" class="mr-5px" /> {{ t('action.export') }}
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
      <template #accountCount="{ row }">
        <el-tag> {{ row.accountCount }} </el-tag>
      </template>
      <template #status="{ row }">
        <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
      </template>
      <template #packageId="{ row }">
        <!--        <DictTag :type="DICT_TYPE.SYSTEM_TENANT_PACKAGE_ID" :value="row.packageId" />-->
        <el-tag v-if="row.packageId === 0" type="danger">系统租户</el-tag>
        <el-tag v-else type="success"> {{ getPackageName(row.packageId) }} </el-tag>
      </template>
      <template #expireTime="{ row }">
        <span>{{ dayjs(row.expireTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>
      <template #createTime="{ row }">
        <span>{{ dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>
      <template #action="{ row }">
        <!-- <el-button type="text" v-hasPermi="['system:tenant:update']" @click="handleUpdate(row)">-->
        <el-button
          link
          type="primary"
          v-hasPermi="['system:tenant:update']"
          @click="handleUpdate(row)"
        >
          <Icon icon="ep:edit" class="mr-5px" /> {{ t('action.edit') }}
        </el-button>
        <el-button
          link
          type="primary"
          v-hasPermi="['system:tenant:update']"
          @click="handleDetail(row)"
        >
          <Icon icon="ep:view" class="mr-5px" /> {{ t('action.detail') }}
        </el-button>
        <el-button
          link
          type="primary"
          v-hasPermi="['system:tenant:delete']"
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
    >
      <template #packageId>
        <el-select v-model="tenantPackageId" placeholder="Select">
          <el-option
            v-for="item in tenantPackageOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </template>
    </Form>
    <!-- 对话框(详情) -->
    <Descriptions
      v-if="actionType === 'detail'"
      :schema="allSchemas.detailSchema"
      :data="detailRef"
    >
      <template #status="{ row }">
        <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
      </template>
      <template #packageId="{ row }">
        <el-tag v-if="row.packageId === 0" type="danger">系统租户</el-tag>
        <el-tag v-else type="success"> {{ getPackageName(row.packageId) }} </el-tag>
      </template>
      <template #expireTime="{ row }">
        <span>{{ dayjs(row.expireTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
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
        :loading="actionLoading"
        @click="submitForm"
      >
        {{ t('action.save') }}
      </el-button>
      <el-button @click="dialogVisible = false">{{ t('dialog.close') }}</el-button>
    </template>
  </Dialog>
</template>
