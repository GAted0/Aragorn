import React, { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { Form, Input, Button, Select, message, Switch } from 'antd';
import { AppContext } from '@renderer/app';
import { UploaderProfile } from '@main/uploaderProfileManager';
import './index.less';

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

export const Uploader = () => {
  const { uploaders } = useContext(AppContext);
  const [currentUploaderName, setCurrentUploaderName] = useState('');
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const [uploaderProfile, setUploaderProfile] = useState({} as UploaderProfile);
  const [form] = Form.useForm();

  useEffect(() => {
    if (uploaders.length > 0 && currentUploaderName === '') {
      handleUploaderSelect(uploaders[0].name);
    }
  }, [uploaders]);

  const history = useHistory();

  useEffect(() => {
    function handleUploaderProfileAdd(res) {
      if (res) {
        history.push('/');
        message.success('上传器配置添加成功');
      }
    }
    function handleUploaderProfileUpdate(res) {
      if (res) {
        message.success('上传器配置更新成功');
      }
    }
    function handleUploaderProfileDelete(res) {
      if (res) {
        history.push(`/uploaderProfile`);
        message.success('上传器配置删除成功');
      }
    }

    ipcRenderer.on('uploader-profile-add-reply', handleUploaderProfileAdd);
    ipcRenderer.on('uploader-profile-update-reply', handleUploaderProfileUpdate);
    ipcRenderer.on('uploader-profile-delete-reply', handleUploaderProfileDelete);

    return () => {
      ipcRenderer.removeListener('uploader-profile-add-reply', handleUploaderProfileAdd);
      ipcRenderer.removeListener('uploader-profile-update-reply', handleUploaderProfileUpdate);
      ipcRenderer.removeListener('uploader-profile-delete-reply', handleUploaderProfileDelete);
    };
  }, []);

  const handleUploaderSelect = (uploaderName: string) => {
    setCurrentUploaderName(uploaderName);
    const uploader = uploaders.find(item => item.name === uploaderName);
    if (uploader) {
      const formInitalValue = uploader?.defaultOptions.reduce(
        (pre, cur) => {
          pre[cur.name] = cur.value;
          return pre;
        },
        {
          id: '',
          name: '',
          uploaderName: uploader.name,
          isDefault: true
        }
      );
      console.log(formInitalValue);
      form.setFieldsValue(formInitalValue as any);
      setUploaderProfile({ id: '', name: '', uploaderName: uploader.name, uploaderOptions: uploader.defaultOptions });
    }
  };

  const handleSubmit = () => {
    form.submit();
  };

  const handleFinish = values => {
    const uploader = uploaders.find(item => item.name === values.uploaderName);
    if (uploader) {
      const uploaderOptions = uploader?.defaultOptions?.map(item => {
        let temp = { ...item };
        temp.value = values[item.name];
        return temp;
      });
      const uploaderProfile: UploaderProfile = {
        id: values.id,
        name: values.name,
        uploaderName: values.uploaderName,
        uploaderOptions,
        isDefault: values.isDefault
      };
      ipcRenderer.send('uploader-profile-add', uploaderProfile);
    }
  };

  const handleDelete = () => {
    const id = form.getFieldValue('id');
    ipcRenderer.send('uploader-profile-delete', id);
  };

  // TODO: 配置测试
  const handleTest = () => {};

  return (
    <div className="uploader-page">
      <div className="side-wrapper">
        <div className="title">上传器</div>
        <div className="list">
          {uploaders.map(item => (
            <div
              key={item.name}
              className={item.name === currentUploaderName ? 'item item-active' : 'item'}
              onClick={() => handleUploaderSelect(item.name)}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
      <div className="content-wrapper">
        <header>
          <h3>配置上传器</h3>
          <hr />
        </header>
        <div className="form-wrapper">
          <Form {...formItemLayout} layout="horizontal" form={form} onFinish={handleFinish}>
            <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '配置名称不能为空' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="uploaderName" style={{ display: 'none' }}>
              <Input />
            </Form.Item>
            {uploaderProfile?.uploaderOptions?.map(item => (
              <Form.Item
                key={item.name}
                name={item.name}
                label={item.label}
                rules={[{ required: item.required, message: `${item.name}不能为空` }]}
                valuePropName={item.valueType === 'switch' ? 'checked' : 'value'}
              >
                {item.valueType === 'input' ? (
                  <Input />
                ) : item.valueType === 'select' ? (
                  <Select>
                    {item.options?.map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                ) : item.valueType === 'switch' ? (
                  <Switch />
                ) : null}
              </Form.Item>
            ))}
            <Form.Item name="isDefault" label="默认配置" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </div>
        <div className="footer">
          <Button type="primary" onClick={handleSubmit} style={{ marginRight: 10 }}>
            保存配置
          </Button>
          <Button style={{ marginRight: 10 }} onClick={handleTest}>
            测试连接
          </Button>
        </div>
      </div>
    </div>
  );
};