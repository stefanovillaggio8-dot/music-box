"""Exercise the pure cache functions without importing or loading audio models."""
import ast,pathlib,unittest

tree=ast.parse(pathlib.Path(__file__).with_name('dj-edge-grids.py').read_text())
nodes=[n for n in tree.body if
    isinstance(n,ast.FunctionDef) and n.name in ('same_evidence','merge_roles') or
    isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MODEL_SHA' for t in n.targets)]
namespace={};exec(compile(ast.Module(body=nodes,type_ignores=[]),'dj-edge-grids.py','exec'),namespace)
merge=namespace['merge_roles'];model=namespace['MODEL_SHA']

class CacheTests(unittest.TestCase):
    def test_one_role_preserves_other_role_and_does_not_mutate_cached_evidence(self):
        old={'sha':'a'*40,'modelSha256':model,'intro':{'beats':[1]},'outro':{'beats':[10]}}
        identity={'sha':'a'*40,'modelSha256':model,'analysisView':'original'}
        result=merge(old,identity,{'intro':{'beats':[2]}})
        self.assertEqual(result['outro'],old['outro'])
        self.assertEqual(result['intro']['beats'],[2])
        self.assertEqual(result['analysisRoles'],['intro','outro'])
        self.assertEqual(old['intro']['beats'],[1])

    def test_changed_source_model_or_view_never_inherits_an_old_role(self):
        identity={'sha':'a'*40,'modelSha256':model,'analysisView':'original'}
        for change in ({'sha':'b'*40},{'modelSha256':'changed'},{'analysisView':'percussive'}):
            old={**identity,**change,'outro':{'beats':[10]}}
            result=merge(old,identity,{'intro':{'beats':[2]}})
            self.assertNotIn('outro',result)
            self.assertEqual(result['analysisRoles'],['intro'])

if __name__=='__main__':unittest.main()
