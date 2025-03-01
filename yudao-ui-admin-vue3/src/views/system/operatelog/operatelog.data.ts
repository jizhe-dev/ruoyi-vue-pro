import { reactive } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { useI18n } from '@/hooks/web/useI18n'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
const { t } = useI18n() // 国际化
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: t('common.index'),
    field: 'id',
    type: 'index',
    form: {
      show: false
    }
  },
  {
    label: '操作模块',
    field: 'module',
    search: {
      show: true
    }
  },
  {
    label: '操作名',
    field: 'name'
  },
  {
    label: '操作类型',
    field: 'type',
    dictType: DICT_TYPE.SYSTEM_OPERATE_TYPE,
    search: {
      show: true
    }
  },
  {
    label: '请求方法名',
    field: 'requestMethod'
  },
  {
    label: '请求地址',
    field: 'requestUrl'
  },
  {
    label: '操作人员',
    field: 'userNickname'
  },
  {
    label: '操作明细',
    field: 'content',
    table: {
      show: false
    }
  },
  {
    label: '用户 IP',
    field: 'userIp',
    table: {
      show: false
    }
  },
  {
    label: 'userAgent',
    field: 'userAgent'
  },
  {
    label: '操作结果',
    field: 'resultCode'
  },
  {
    label: '操作日期',
    field: 'startTime',
    form: {
      show: false
    }
  },
  {
    label: '执行时长',
    field: 'duration'
  },
  {
    label: '操作日期',
    field: 'daterange',
    table: {
      show: false
    },
    form: {
      show: false
    },
    detail: {
      show: false
    },
    search: {
      show: true,
      component: 'DatePicker',
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  },
  {
    label: t('table.action'),
    field: 'action',
    width: '120px',
    form: {
      show: false
    },
    detail: {
      show: false
    }
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
