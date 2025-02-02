import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import { observer } from 'mobx-react';
import { Drawer, Table, Message } from 'hubble-ui';

import { Tooltip } from '../../../common';
import MetadataConfigsRootStore from '../../../../stores/GraphManagementStore/metadataConfigsStore/metadataConfigsStore';

import type { MetadataProperty } from '../../../../stores/types/GraphManagementStore/metadataConfigsStore';

const CheckProperty: React.FC = observer(() => {
  const { metadataPropertyStore, graphViewStore } = useContext(
    MetadataConfigsRootStore
  );
  const [popIndex, setPopIndex] = useState<number | null>(null);
  const deleteWrapperRef = useRef<HTMLDivElement>(null);

  const handleOutSideClick = useCallback(
    (e: MouseEvent) => {
      // note: .new-fc-one-drawer-content-wrapper sometimes only contain one single element?
      // however if you capture .new-fc-one-drawer-wrapper-body-container it still returns itself and contains all children
      // thus here we capture body-container as drawer
      const drawerWrapper = document.querySelector(
        '.new-fc-one-drawer-wrapper-body-container'
      );

      const deleteWrapper = document.querySelector('.metadata-graph-tooltips');

      if (
        graphViewStore.currentDrawer === 'check-property' &&
        drawerWrapper &&
        !drawerWrapper.contains(e.target as Element)
      ) {
        if (
          deleteWrapper === null &&
          (e.target as Element).className !==
            'metadata-graph-property-manipulation'
        ) {
          graphViewStore.setCurrentDrawer('');
        }

        if (
          deleteWrapper &&
          !deleteWrapper.contains(e.target as Element) &&
          (e.target as Element).className !==
            'metadata-graph-property-manipulation'
        ) {
          graphViewStore.setCurrentDrawer('');
        }
      }

      if (
        popIndex !== null &&
        deleteWrapper &&
        !deleteWrapper.contains(e.target as Element)
      ) {
        setPopIndex(null);
      }
    },
    [graphViewStore, popIndex]
  );

  const handleCloseDrawer = () => {
    graphViewStore.setCurrentDrawer('');
  };

  useEffect(() => {
    document.addEventListener('click', handleOutSideClick, true);

    return () => {
      document.removeEventListener('click', handleOutSideClick, true);
    };
  }, [handleOutSideClick]);

  const columnConfigs = [
    {
      title: '属性名称',
      dataIndex: 'name'
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      render(text: string) {
        const realText = text === 'TEXT' ? 'string' : text.toLowerCase();

        return realText;
      }
    },
    {
      title: '基数',
      dataIndex: 'cardinality'
    },
    {
      title: '操作',
      render(_: any, records: MetadataProperty, index: number) {
        return (
          <Tooltip
            placement="bottom-end"
            tooltipShown={index === popIndex}
            modifiers={{
              offset: {
                offset: '0, 10'
              }
            }}
            tooltipWrapperProps={{
              className: 'metadata-graph-tooltips',
              style: { zIndex: 1041 }
            }}
            tooltipWrapper={
              <div ref={deleteWrapperRef}>
                {metadataPropertyStore.metadataPropertyUsingStatus &&
                metadataPropertyStore.metadataPropertyUsingStatus[
                  records.name
                ] ? (
                  <p style={{ width: 200 }}>
                    当前属性数据正在使用中，不可删除。
                  </p>
                ) : (
                  <>
                    <p>确认删除此属性？</p>
                    <p>删除后无法恢复，请谨慎操作。</p>
                    <div
                      style={{
                        display: 'flex',
                        marginTop: 12,
                        color: '#2b65ff',
                        cursor: 'pointer'
                      }}
                    >
                      <div
                        style={{ marginRight: 16, cursor: 'pointer' }}
                        onClick={async () => {
                          setPopIndex(null);
                          await metadataPropertyStore.deleteMetadataProperty([
                            records.name
                          ]);
                          if (
                            metadataPropertyStore.requestStatus
                              .deleteMetadataProperty === 'success'
                          ) {
                            Message.success({
                              content: '删除成功',
                              size: 'medium',
                              showCloseIcon: false
                            });
                            metadataPropertyStore.fetchMetadataPropertyList();
                          }
                          if (
                            metadataPropertyStore.requestStatus
                              .deleteMetadataProperty === 'failed'
                          ) {
                            Message.error({
                              content: metadataPropertyStore.errorMessage,
                              size: 'medium',
                              showCloseIcon: false
                            });
                          }
                        }}
                      >
                        确认
                      </div>
                      <div
                        onClick={() => {
                          setPopIndex(null);
                        }}
                      >
                        取消
                      </div>
                    </div>
                  </>
                )}
              </div>
            }
            childrenProps={{
              className: 'metadata-graph-property-manipulation',
              async onClick() {
                await metadataPropertyStore.checkIfUsing([records.name]);
                if (
                  metadataPropertyStore.requestStatus.checkIfUsing === 'success'
                ) {
                  setPopIndex(index);
                }
              }
            }}
          >
            删除
          </Tooltip>
        );
      }
    }
  ];

  return (
    <Drawer
      title="查看属性"
      width={634}
      destroyOnClose
      mask={false}
      visible={graphViewStore.currentDrawer === 'check-property'}
      onClose={handleCloseDrawer}
      footer={[]}
    >
      <div className="metadata-configs-drawer">
        <Table
          columns={columnConfigs}
          dataSource={metadataPropertyStore.metadataProperties}
          pagination={false}
        />
      </div>
    </Drawer>
  );
});

export default CheckProperty;
