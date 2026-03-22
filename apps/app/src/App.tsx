import {useEffect, useState} from 'react';
import {client} from './lib/api';
import type {InferResponseType} from "hono";

type Book = Extract<InferResponseType<typeof client.books.$get>, { id: number }[]>[number];

function App() {
    const [books, setBooks] = useState<Book[]>([]);
    const [newBook, setNewBook] = useState({
        title: '',
        comment: '',
        isFavorite: false,
        status: 'toRead' as const
    });
    const [message, setMessage] = useState('');
    const [successId, setSuccessId] = useState<number | null>(null);

    const fetchRoot = async () => {
        const res = await client.index.$get();

        if (res.ok) {
            const data = await res.text();
            setMessage(data);
            console.log("Root Message:", data);
        }
    };

    // 1. READ: 一覧取得
    const fetchBooks = async () => {
        const res = await client.books.$get();
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setBooks(data);
        }
    };


    // 2. CREATE: 追加 (status対応)
    const addBook = async () => {
        if (!newBook.title) return;

        await client.books.$post({
            json: {
                title: newBook.title,
                status: newBook.status,
                comment: newBook.comment,
                isFavorite: newBook.isFavorite
            }
        });

        setNewBook({title: '', comment: '', isFavorite: false, status: 'toRead'});
        void fetchBooks();
    };

    // 3. UPDATE: 汎用更新関数 (メッセージ表示付き)
    const updateBook = async (id: number, updates: Partial<Book>) => {
        const target = books.find(b => b.id === id);
        if (!target) return;

        const res = await client.books[':id'].$put({
            param: {id: id.toString()},
            json: {
                title: updates.title ?? target.title,
                status: (updates.status ?? target.status) as "toRead" | "reading" | "read",
                comment: updates.comment ?? target.comment ?? '',
                isFavorite: updates.isFavorite ?? target.isFavorite ?? false
            }
        });

        if (res.ok) {
            void fetchBooks();
            // 保存完了メッセージを3秒間表示
            setSuccessId(id);
            setTimeout(() => setSuccessId(null), 3000);
        }
    };

    // 4. DELETE: 削除
    const deleteBook = async (id: number) => {
        await client.books[':id'].$delete({
            param: {id: id.toString()}
        });
        fetchBooks();
    };

    useEffect(() => {
        fetchRoot();
        fetchBooks();
    }, []);

    return (
        <div style={{padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif'}}>
            <h1>Itsuki's Bookshelf</h1>
            <p>{message}</p>

            {/* --- 追加フォーム --- */}
            <div style={{
                marginBottom: '30px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                boxSizing: 'border-box' // 親も念のため
            }}>
                <h3>Add New Book</h3>
                <input
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    placeholder="Title (Required)"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '10px',
                        padding: '8px',
                        boxSizing: 'border-box' // ★これ重要
                    }}
                />

                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                    <select
                        value={newBook.status}
                        onChange={(e) => setNewBook({...newBook, status: e.target.value as any})}
                        style={{
                            padding: '8px',
                            flex: 1,
                            minWidth: 0, // flexアイテムのはみ出し防止
                            boxSizing: 'border-box'
                        }}
                    >
                        <option value="toRead">📚 To Read</option>
                        <option value="reading">📖 Reading</option>
                        <option value="read">✅ Read</option>
                    </select>

                    <div
                        onClick={() => setNewBook({...newBook, isFavorite: !newBook.isFavorite})}
                        style={{
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            userSelect: 'none',
                            flexShrink: 0 // 星が潰れないように固定
                        }}
                    >
                        {newBook.isFavorite ? '⭐' : '☆'}
                    </div>
                </div>

                <textarea
                    value={newBook.comment}
                    onChange={(e) => setNewBook({...newBook, comment: e.target.value})}
                    placeholder="Comment"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '10px',
                        padding: '8px',
                        minHeight: '60px', // 少し高さを出す
                        boxSizing: 'border-box', // ★これ重要
                        resize: 'vertical' // 横に伸びて壊れるのを防ぐ
                    }}
                />
                <button onClick={addBook} style={{
                    width: '100%',
                    padding: '10px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                }}>
                    Add to Shelf
                </button>
            </div>

            {/* --- 本の一覧 --- */}
            <ul style={{listStyle: 'none', padding: 0}}>
                {books.map((book) => (
                    <li key={book.id} style={{
                        marginBottom: '15px',
                        padding: '15px',
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        position: 'relative',
                        backgroundColor: book.isFavorite ? '#fffdf0' : '#fff'
                    }}>
                        {/* 保存完了バッジ */}
                        {successId === book.id && (
                            <span style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '10px',
                                background: '#28a745',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.7rem'
                            }}>
                                Saved!
                            </span>
                        )}

                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <span onClick={() => void updateBook(book.id, {isFavorite: !book.isFavorite})}
                                      style={{cursor: 'pointer', fontSize: '1.2rem'}}>
                                    {book.isFavorite ? '⭐' : '☆'}
                                </span>
                                <span style={{
                                    fontWeight: 'bold',
                                    textDecoration: book.status === 'read' ? 'line-through' : 'none',
                                    color: book.status === 'read' ? '#888' : '#333'
                                }}>
                                    {book.title}
                                </span>
                            </div>
                            <button onClick={() => void deleteBook(book.id)}
                                    style={{color: 'red', border: 'none', background: 'none', cursor: 'pointer'}}>Delete
                            </button>
                        </div>

                        {/* 編集エリア */}
                        <div style={{marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <select
                                    value={book.status}
                                    onChange={(e) => void updateBook(book.id, {status: e.target.value as any})}
                                    style={{fontSize: '0.8rem', padding: '4px'}}
                                >
                                    <option value="toRead">To Read</option>
                                    <option value="reading">Reading</option>
                                    <option value="read">Read</option>
                                </select>

                                <input
                                    type="text"
                                    defaultValue={book.comment || ''}
                                    id={`comment-${book.id}`}
                                    placeholder="Add comment..."
                                    style={{
                                        flex: 1,
                                        padding: '4px',
                                        fontSize: '0.8rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById(`comment-${book.id}`) as HTMLInputElement;
                                        void updateBook(book.id, {comment: input.value});
                                    }}
                                    style={{fontSize: '0.8rem', padding: '4px 10px', cursor: 'pointer'}}
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;