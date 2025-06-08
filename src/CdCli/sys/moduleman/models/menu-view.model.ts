import { ViewEntity, ViewColumn } from 'typeorm';

// return \DB::table('menu')
//             ->join('module, 'menu.module_id, '=, 'module.module_id')
//             ->join('cd_obj, 'menu.menu_action_id, '=, 'cd_obj.cd_obj_id')
//             ->select(\DB::raw(mB::fieldsToStr(self::menu_fields_config($clientAppId))))
//             ->where("active", true)
//             ->distinct();

// @ViewEntity({
//     expression: (connection: Connection) => connection.createQueryBuilder()
//         .select("post.id", "id")
//         .addSelect("post.name", "name")
//         .addSelect("category.name", "categoryName")
//         .from(Post, "post")
//         .leftJoin(Category, "category", "category.id = post.categoryId")
// })

@ViewEntity({
  name: 'menu_view',
  synchronize: false,
  expression: `
     SELECT 
        menu.menu_id AS menu_id,
        menu.menu_name AS menu_label,
        menu.menu_name AS menu_name,
        menu.menu_guid AS menu_guid,
        menu.menu_closet_file AS closet_file,
        menu.menu_enabled AS menu_enabled,
        menu.menu_description AS menu_description,
        menu.menu_icon AS menu_icon,
        menu.icon_type AS icon_type,
        menu.doc_id AS doc_id,
        menu.menu_parent_id AS menu_parent_id,
        menu.path AS path,
        menu.is_title AS is_title,
        menu.badge AS badge,
        menu.is_layout AS is_layout,
        menu.menu_is_public AS menu_is_public,
        module.module_id AS module_id,
        module.module_guid AS module_guid,
        module.module_name AS module_name,
        module.module_is_public AS module_is_public,
        module.is_sys_module AS is_sys_module,
        (SELECT NULL) AS children,
        (SELECT NULL) AS menu_action,
        cd_obj.cd_obj_id AS cd_obj_id,
        cd_obj.cd_obj_name AS cd_obj_name,
        cd_obj.last_sync_date AS last_sync_date,
        cd_obj.cd_obj_disp_name AS cd_obj_disp_name,
        cd_obj.cd_obj_guid AS cd_obj_guid,
        cd_obj.cd_obj_type_guid AS cd_obj_type_guid,
        cd_obj.last_modification_date AS last_modification_date,
        cd_obj.parent_module_guid AS parent_module_guid,
        cd_obj.parent_class_guid AS parent_class_guid,
        cd_obj.parent_obj AS parent_obj,
        cd_obj.show_name AS show_name,
        cd_obj.icon AS icon,
        cd_obj.show_icon AS show_icon,
        cd_obj.curr_val AS curr_val,
        cd_obj.cd_obj_enabled AS cd_obj_enabled
    FROM
        ((menu
        JOIN module ON ((menu.module_id = module.module_id)))
        JOIN cd_obj ON ((cd_obj.cd_obj_id = menu.cd_obj_id)))
    `,
})
export class MenuViewModel {
  @ViewColumn({
    name: 'menu_id',
  })
  menuId?: number;

  @ViewColumn({
    name: 'menu_name',
  })
  menuName?: string;

  @ViewColumn({
    name: 'menu_label',
  })
  menuLabel?: string;

  @ViewColumn({
    name: 'menu_guid',
  })
  menuGuid?: string;

  @ViewColumn({
    name: 'closet_file',
  })
  closetFile?: string;

  @ViewColumn({
    name: 'cd_obj_id',
  })
  cdObjId?: number;

  @ViewColumn({
    name: 'menu_enabled',
  })
  menuEnabled?: boolean;

  @ViewColumn({
    name: 'menu_description',
  })
  menuDescription?: string;

  @ViewColumn({
    name: 'menu_icon',
  })
  menuIcon?: string;

  @ViewColumn({
    name: 'icon_type',
  })
  iconType?: string;

  @ViewColumn({
    name: 'doc_id',
  })
  docId?: number;

  @ViewColumn({
    name: 'menu_parent_id',
  })
  menuParentId?: number;

  @ViewColumn({
    name: 'path',
  })
  path?: string;

  @ViewColumn({
    name: 'is_title',
  })
  isTitle?: boolean | number | null;

  @ViewColumn({
    name: 'badge',
  })
  badge?: string;

  @ViewColumn({
    name: 'is_layout',
  })
  isLayout?: boolean | number | null;

  @ViewColumn({
    name: 'module_id',
  })
  moduleId?: number;

  @ViewColumn({
    name: 'module_guid',
  })
  moduleGuid?: string;

  @ViewColumn({
    name: 'module_name',
  })
  moduleName?: string;

  @ViewColumn({
    name: 'module_is_public',
  })
  moduleIsPublic?: boolean | number;

  @ViewColumn({
    name: 'is_sys_module',
  })
  isSysModule?: boolean | number;

  @ViewColumn({
    name: 'children',
  })
  children?: MenuViewModel[] | null;

  @ViewColumn({
    name: 'menu_action',
  })
  menuAction?: string;

  @ViewColumn({
    name: 'cd_obj_name',
  })
  cdObjName?: string;

  @ViewColumn({
    name: 'last_sync_date',
  })
  lastSyncDate?: string;

  @ViewColumn({
    name: 'cd_obj_disp_name',
  })
  cdObjDispName?: string;

  @ViewColumn({
    name: 'cd_obj_guid',
  })
  cdObjGuid?: string;

  @ViewColumn({
    name: 'cd_obj_type_guid',
  })
  cdObjTypeGuid?: string;

  @ViewColumn({
    name: 'last_modification_date',
  })
  lastModificationDate?: string;

  @ViewColumn({
    name: 'parent_module_guid',
  })
  parentModuleGuid?: string;

  @ViewColumn({
    name: 'parent_class_guid',
  })
  parentClassGuid?: string;

  @ViewColumn({
    name: 'parent_obj',
  })
  parentObj?: string;

  @ViewColumn({
    name: 'show_name',
  })
  showName?: boolean;

  @ViewColumn({
    name: 'icon',
  })
  icon?: string;

  @ViewColumn({
    name: 'show_icon',
  })
  showIcon?: boolean;

  @ViewColumn({
    name: 'curr_val',
  })
  currVal?: string;

  @ViewColumn({
    name: 'cd_obj_enabled',
  })
  cdObjEnabled?: boolean | number;

  // @ViewColumn(
  //     {
  //         name: 'menu_is_public'
  //     }
  // )
  // menuIsPublic?: boolean | number;

  @ViewColumn({
    name: 'menu_is_public',
  })
  menuIsPublic?: number;
}
